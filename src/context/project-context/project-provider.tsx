import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import {
    projectContext,
    type DiagramHandlers,
    type RoomUser,
} from './project-context';
import {
    apiClient,
    type CloudProject,
    type CollaboratorRole,
    type ProjectCollaborator,
} from '@/lib/api/api-client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/components/toast/use-toast';
import { AuthDialog } from '@/dialogs/auth-dialog/auth-dialog';
import { ProjectsCloudDialog } from '@/dialogs/projects-cloud-dialog/projects-cloud-dialog';
import { CollaboratorsDialog } from '@/dialogs/collaborators-dialog/collaborators-dialog';

const USER_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#14B8A6', // Teal
];

function getUserColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % USER_COLORS.length;
    return USER_COLORS[index];
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { user, isAuthenticated } = useAuth();

    const [currentProject, setCurrentProject] = useState<CloudProject | null>(
        null
    );
    const [userRole, setUserRole] = useState<CollaboratorRole | null>(null);
    const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>(
        []
    );
    const [activeRoomUsers, setActiveRoomUsers] = useState<RoomUser[]>([]);
    const [cloudProjects, setCloudProjects] = useState<CloudProject[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);

    const [isProjectsDialogOpen, setIsProjectsDialogOpen] =
        useState<boolean>(false);
    const [isCollaboratorsDialogOpen, setIsCollaboratorsDialogOpen] =
        useState<boolean>(false);

    const openProjectsDialog = useCallback(
        () => setIsProjectsDialogOpen(true),
        []
    );
    const closeProjectsDialog = useCallback(
        () => setIsProjectsDialogOpen(false),
        []
    );
    const openCollaboratorsDialog = useCallback(
        () => setIsCollaboratorsDialogOpen(true),
        []
    );
    const closeCollaboratorsDialog = useCallback(
        () => setIsCollaboratorsDialogOpen(false),
        []
    );

    const socketRef = useRef<Socket | null>(null);
    const diagramHandlersRef = useRef<DiagramHandlers | null>(null);
    const isRemoteUpdatingRef = useRef<boolean>(false);
    const broadcastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    const registerDiagramHandlers = useCallback((handlers: DiagramHandlers) => {
        diagramHandlersRef.current = handlers;
        return () => {
            if (diagramHandlersRef.current === handlers) {
                diagramHandlersRef.current = null;
            }
        };
    }, []);

    // Fetch user cloud projects
    const refreshProjects = useCallback(async (): Promise<CloudProject[]> => {
        if (!isAuthenticated) {
            setCloudProjects([]);
            return [];
        }
        setIsLoadingProjects(true);
        try {
            const projects = await apiClient.listProjects();
            setCloudProjects(projects);
            return projects;
        } catch (error: unknown) {
            console.error('Error fetching projects:', error);
            toast({
                variant: 'destructive',
                title: 'Error al cargar proyectos',
                description:
                    (error as Error)?.message ||
                    'No se pudieron obtener los proyectos.',
            });
            return [];
        } finally {
            setIsLoadingProjects(false);
        }
    }, [isAuthenticated]);

    // Load projects list on auth state change
    useEffect(() => {
        if (isAuthenticated) {
            refreshProjects();
        } else {
            setCurrentProject(null);
            setUserRole(null);
            setCollaborators([]);
            setActiveRoomUsers([]);
            setCloudProjects([]);
        }
    }, [isAuthenticated, refreshProjects]);

    // Fetch collaborators for a project
    const fetchCollaborators = useCallback(
        async (projectId?: string): Promise<ProjectCollaborator[]> => {
            const id = projectId || currentProject?.id;
            if (!id) return [];

            try {
                const list = await apiClient.listCollaborators(id);
                const safeList = Array.isArray(list) ? list : [];
                setCollaborators(safeList);
                return safeList;
            } catch (error: unknown) {
                console.error('Error fetching collaborators:', error);
                setCollaborators([]);
                return [];
            }
        },
        [currentProject?.id]
    );

    // Load a project and sync into diagram canvas
    const loadProject = useCallback(
        async (id: string): Promise<CloudProject> => {
            const project = await apiClient.getProject(id);
            setCurrentProject(project);

            // Determine user's role
            if (user?.id === project.ownerId) {
                setUserRole('owner');
            } else {
                const collab = project.collaborators?.find(
                    (c) => c.userId === user?.id
                );
                setUserRole(collab?.role || 'viewer');
            }

            if (project.collaborators) {
                setCollaborators(project.collaborators);
            }

            // Sync project data into canvas if handlers are registered
            if (project.data && diagramHandlersRef.current) {
                isRemoteUpdatingRef.current = true;
                diagramHandlersRef.current.loadDiagram(project.data);
                setTimeout(() => {
                    isRemoteUpdatingRef.current = false;
                }, 500);
            }

            toast({
                title: 'Proyecto cargado',
                description: `Proyecto "${project.title}" abierto con éxito.`,
            });

            return project;
        },
        [user?.id]
    );

    // Save project
    const saveCurrentProject = useCallback(
        async (diagramData?: unknown) => {
            if (!currentProject) {
                toast({
                    variant: 'destructive',
                    title: 'No hay proyecto activo',
                    description:
                        'Debes tener un proyecto en la nube abierto para guardar.',
                });
                return;
            }

            const dataToSave =
                diagramData || diagramHandlersRef.current?.getCurrentDiagram();
            if (!dataToSave) return;

            try {
                const updated = await apiClient.updateProject(
                    currentProject.id,
                    {
                        title: currentProject.title,
                        description: currentProject.description,
                        data: dataToSave,
                    }
                );
                setCurrentProject((prev) =>
                    prev ? { ...prev, ...updated } : null
                );
                toast({
                    title: 'Guardado con éxito',
                    description: 'El diagrama fue guardado en la nube.',
                });
            } catch (error: unknown) {
                toast({
                    variant: 'destructive',
                    title: 'Error al guardar',
                    description:
                        (error as Error)?.message ||
                        'No se pudo guardar el proyecto.',
                });
            }
        },
        [currentProject]
    );

    // Create a new cloud project
    const createProject = useCallback(
        async (
            title: string,
            description?: string,
            data?: unknown
        ): Promise<CloudProject> => {
            const currentData =
                data || diagramHandlersRef.current?.getCurrentDiagram();
            const newProj = await apiClient.createProject(
                title,
                description,
                currentData
            );
            await refreshProjects();
            setCurrentProject(newProj);
            setUserRole('owner');
            toast({
                title: 'Proyecto creado',
                description: `Proyecto "${newProj.title}" creado con éxito.`,
            });
            return newProj;
        },
        [refreshProjects]
    );

    // Delete a project
    const deleteProject = useCallback(
        async (id: string) => {
            await apiClient.deleteProject(id);
            if (currentProject?.id === id) {
                setCurrentProject(null);
                setUserRole(null);
                setActiveRoomUsers([]);
                setCollaborators([]);
            }
            await refreshProjects();
            toast({
                title: 'Proyecto eliminado',
                description: 'El proyecto fue eliminado exitosamente.',
            });
        },
        [currentProject?.id, refreshProjects]
    );

    // Switch/close project
    const switchProject = useCallback(
        async (id: string | null) => {
            if (!id) {
                setCurrentProject(null);
                setUserRole(null);
                setActiveRoomUsers([]);
                setCollaborators([]);
                return;
            }
            await loadProject(id);
        },
        [loadProject]
    );

    // Add collaborator
    const addCollaborator = useCallback(
        async (
            email: string,
            role: 'viewer' | 'editor' | 'admin'
        ): Promise<ProjectCollaborator> => {
            if (!currentProject) throw new Error('No hay proyecto activo');
            const collab = await apiClient.addCollaborator(
                currentProject.id,
                email,
                role
            );
            await fetchCollaborators(currentProject.id);
            toast({
                title: 'Colaborador invitado',
                description: `Se invitó a ${email} con rol ${role}.`,
            });
            return collab;
        },
        [currentProject, fetchCollaborators]
    );

    // Remove collaborator
    const removeCollaborator = useCallback(
        async (userId: string) => {
            if (!currentProject) return;
            await apiClient.removeCollaborator(currentProject.id, userId);
            await fetchCollaborators(currentProject.id);
            toast({
                title: 'Colaborador removido',
                description: 'Se removió el colaborador del proyecto.',
            });
        },
        [currentProject, fetchCollaborators]
    );

    // Real-Time Socket Connection & Management
    useEffect(() => {
        if (!isAuthenticated || !currentProject || !user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setActiveRoomUsers([]);
            return;
        }

        const envWsUrl =
            (typeof window !== 'undefined' && window.env?.WS_URL) ||
            import.meta.env.VITE_WS_URL;

        let wsUrl: string;
        if (envWsUrl) {
            wsUrl = envWsUrl;
        } else if (
            typeof window !== 'undefined' &&
            window.location.hostname.includes('onrender.com')
        ) {
            wsUrl = 'https://diagramador-1.onrender.com';
        } else {
            const defaultHost =
                typeof window !== 'undefined' && window.location.hostname
                    ? window.location.hostname
                    : 'localhost';
            wsUrl = `http://${defaultHost}:3000`;
        }
        const socket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });
        socketRef.current = socket;

        const roomUser: RoomUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            color: getUserColor(user.id),
        };

        socket.on('connect', () => {
            socket.emit('join_project', {
                projectId: currentProject.id,
                user: roomUser,
            });
        });

        socket.on('room_users', (users: RoomUser[]) => {
            setActiveRoomUsers(users);
        });

        socket.on('user_joined', ({ user: joinedUser }: { user: RoomUser }) => {
            if (joinedUser.id !== user.id) {
                toast({
                    title: 'Colaborador en línea',
                    description: `${joinedUser.name} se unió a la sala`,
                });
            }
        });

        socket.on('user_left', ({ user: leftUser }: { user: RoomUser }) => {
            if (leftUser.id !== user.id) {
                toast({
                    title: 'Colaborador desconectado',
                    description: `${leftUser.name} salió de la sala`,
                });
            }
        });

        socket.on(
            'diagram_change',
            (payload: {
                change: unknown;
                sender?: RoomUser;
                timestamp?: number;
            }) => {
                if (payload.change && diagramHandlersRef.current) {
                    isRemoteUpdatingRef.current = true;
                    diagramHandlersRef.current.loadDiagram(payload.change);
                    if (payload.sender && payload.sender.id !== user.id) {
                        toast({
                            title: 'Diagrama sincronizado',
                            description: `${payload.sender.name} actualizó el diagrama.`,
                        });
                    }
                    setTimeout(() => {
                        isRemoteUpdatingRef.current = false;
                    }, 500);
                }
            }
        );

        return () => {
            socket.emit('leave_project', { projectId: currentProject.id });
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, currentProject, user]);

    // Broadcast diagram change (debounced)
    const broadcastDiagramChange = useCallback(
        (diagramData: unknown) => {
            if (isRemoteUpdatingRef.current) return;
            if (!currentProject || !socketRef.current?.connected) return;

            if (broadcastTimeoutRef.current) {
                clearTimeout(broadcastTimeoutRef.current);
            }

            broadcastTimeoutRef.current = setTimeout(() => {
                if (socketRef.current?.connected && currentProject) {
                    socketRef.current.emit('diagram_change', {
                        projectId: currentProject.id,
                        change: diagramData,
                        data: diagramData,
                    });
                }
            }, 300);
        },
        [currentProject]
    );

    return (
        <projectContext.Provider
            value={{
                currentProject,
                userRole,
                collaborators,
                activeRoomUsers,
                cloudProjects,
                isLoadingProjects,

                isProjectsDialogOpen,
                openProjectsDialog,
                closeProjectsDialog,
                isCollaboratorsDialogOpen,
                openCollaboratorsDialog,
                closeCollaboratorsDialog,

                refreshProjects,
                loadProject,
                saveCurrentProject,
                createProject,
                deleteProject,
                switchProject,

                fetchCollaborators,
                addCollaborator,
                removeCollaborator,

                broadcastDiagramChange,
                registerDiagramHandlers,
            }}
        >
            {children}
            <AuthDialog />
            <ProjectsCloudDialog />
            <CollaboratorsDialog />
        </projectContext.Provider>
    );
};
