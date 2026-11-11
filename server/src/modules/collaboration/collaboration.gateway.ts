import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  color?: string;
  avatar?: string;
}

interface SocketClientData {
  projectId: string;
  user: UserInfo;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);

  // Map of socket.id -> SocketClientData
  private readonly socketClients = new Map<string, SocketClientData>();

  // Map of projectId -> Map<socketId, UserInfo>
  private readonly roomUsers = new Map<string, Map<string, UserInfo>>();

  constructor(private readonly projectsService: ProjectsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const clientData = this.socketClients.get(client.id);

    if (clientData) {
      const { projectId, user } = clientData;
      const room = `project_${projectId}`;

      // Remove from room registry
      const roomMap = this.roomUsers.get(projectId);
      if (roomMap) {
        roomMap.delete(client.id);
        if (roomMap.size === 0) {
          this.roomUsers.delete(projectId);
        } else {
          // Notify remaining users
          this.server.to(room).emit('user_left', {
            user,
            socketId: client.id,
          });
          this.server.to(room).emit('room_users', Array.from(roomMap.values()));
        }
      }

      this.socketClients.delete(client.id);
    }
  }

  @SubscribeMessage('join_project')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; user: UserInfo },
  ) {
    const { projectId, user } = data;
    if (!projectId || !user) {
      return { status: 'error', message: 'projectId and user are required' };
    }

    const room = `project_${projectId}`;
    client.join(room);

    // Save client info
    this.socketClients.set(client.id, { projectId, user });

    // Track room users
    if (!this.roomUsers.has(projectId)) {
      this.roomUsers.set(projectId, new Map<string, UserInfo>());
    }
    const roomMap = this.roomUsers.get(projectId)!;
    roomMap.set(client.id, user);

    const activeUsers = Array.from(roomMap.values());

    // Broadcast user joined and updated user list
    client.to(room).emit('user_joined', { user, socketId: client.id });
    this.server.to(room).emit('room_users', activeUsers);

    this.logger.log(
      `User ${user.email} (${client.id}) joined room ${room}. Total online: ${activeUsers.length}`,
    );

    return {
      status: 'ok',
      room,
      onlineUsers: activeUsers,
    };
  }

  @SubscribeMessage('leave_project')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const { projectId } = data;
    const room = `project_${projectId}`;
    const clientData = this.socketClients.get(client.id);

    client.leave(room);

    if (clientData && clientData.projectId === projectId) {
      const roomMap = this.roomUsers.get(projectId);
      if (roomMap) {
        roomMap.delete(client.id);
        const activeUsers = Array.from(roomMap.values());

        client.to(room).emit('user_left', {
          user: clientData.user,
          socketId: client.id,
        });
        client.to(room).emit('room_users', activeUsers);
      }
      this.socketClients.delete(client.id);
    }

    return { status: 'ok', message: `Left ${room}` };
  }

  @SubscribeMessage('diagram_change')
  async handleDiagramChange(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      projectId: string;
      change: any;
      data?: any;
    },
  ) {
    const { projectId, change, data } = payload;
    const room = `project_${projectId}`;
    const clientData = this.socketClients.get(client.id);

    // Broadcast diagram change to all other clients in the room
    client.to(room).emit('diagram_change', {
      change,
      sender: clientData?.user,
      socketId: client.id,
      timestamp: Date.now(),
    });

    // If whole snapshot data is sent, optionally persist to database in background
    if (data && clientData?.user?.id) {
      try {
        await this.projectsService.update(projectId, clientData.user.id, {
          data,
        });
      } catch (err) {
        this.logger.debug(
          `Could not auto-save diagram data from socket: ${err.message}`,
        );
      }
    }
  }

  @SubscribeMessage('cursor_move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      projectId: string;
      position: { x: number; y: number };
    },
  ) {
    const { projectId, position } = payload;
    const room = `project_${projectId}`;
    const clientData = this.socketClients.get(client.id);

    // Broadcast cursor position to all other collaborators in the room
    client.to(room).emit('cursor_move', {
      position,
      user: clientData?.user,
      socketId: client.id,
    });
  }
}

