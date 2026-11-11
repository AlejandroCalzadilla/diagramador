# ChartDB Server

Production-ready NestJS backend for ChartDB, featuring PostgreSQL storage with TypeORM, JWT authentication, project management, collaborative permissions, and real-time WebSocket rooms.

---

## Architecture Overview

```
server/
├── docker-compose.yml              # PostgreSQL 16 Alpine container
├── .env.example                    # Environment variable template
├── src/
│   ├── app.module.ts               # Core NestJS application module
│   ├── main.ts                     # Bootstrap, validation pipe, CORS, global /api prefix
│   ├── common/
│   │   ├── decorators/             # @CurrentUser() param decorator
│   │   ├── guards/                 # JwtAuthGuard (Passport JWT)
│   │   └── interfaces/             # JwtPayload interface
│   ├── database/
│   │   └── database.module.ts      # TypeORM configuration with PostgreSQL
│   └── modules/
│       ├── users/                  # User entity & service
│       ├── auth/                   # Registration, login, JWT strategy & guards
│       ├── projects/               # Project & collaborator entities, services, controllers
│       └── collaboration/          # Real-time Socket.IO WebSocket gateway
```

---

## Quick Start

### 1. Start PostgreSQL with Docker
```bash
cd server
npm run docker:up
# Or from root: npm run server:docker:up
```

### 2. Configure Environment
Copy `.env.example` to `.env` (pre-configured with local defaults):
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run start:dev
# Or from root: npm run server:dev
```
The REST API runs at `http://localhost:3000/api`.
The WebSocket Gateway listens at `ws://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm run start:prod
```

---

## Database Schema (PostgreSQL / TypeORM)

- **`users`**:
  - `id`: UUID (Primary Key)
  - `email`: VARCHAR (Unique)
  - `password`: VARCHAR (Hashed with bcrypt, hidden from default selects)
  - `name`: VARCHAR
  - `createdAt`, `updatedAt`: Timestamps with time zone

- **`projects`**:
  - `id`: UUID (Primary Key)
  - `title`: VARCHAR
  - `description`: TEXT (Nullable)
  - `ownerId`: UUID (Foreign Key -> users.id, CASCADE)
  - `data`: JSONB (Stores diagram tables, relationships, notes, custom areas, settings)
  - `createdAt`, `updatedAt`: Timestamps with time zone

- **`project_collaborators`**:
  - `id`: UUID (Primary Key)
  - `projectId`: UUID (Foreign Key -> projects.id, CASCADE)
  - `userId`: UUID (Foreign Key -> users.id, CASCADE)
  - `role`: ENUM ('viewer', 'editor', 'admin')
  - `createdAt`: Timestamp with time zone
  - Unique Constraint: `(projectId, userId)`

---

## REST API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user `{ email, password, name }` | No |
| `POST` | `/api/auth/login` | Login `{ email, password }` -> returns `{ accessToken, user }` | No |
| `GET`  | `/api/auth/me` | Fetch current authenticated user | Yes (Bearer JWT) |

### Projects (`/api/projects`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/projects` | Create a new project `{ title, description?, data? }` | Yes |
| `GET`  | `/api/projects` | List projects (owned or collaborative) with role | Yes |
| `GET`  | `/api/projects/:id` | Get project detail & diagram data (access verified) | Yes |
| `PUT`  | `/api/projects/:id` | Update project or diagram data (editor/owner required) | Yes |
| `DELETE` | `/api/projects/:id` | Delete project (owner only) | Yes |

### Collaborators (`/api/projects/:id/collaborators`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET`  | `/api/projects/:id/collaborators` | List owner and collaborators | Yes |
| `POST` | `/api/projects/:id/collaborators` | Add collaborator `{ email, role }` (owner/admin) | Yes |
| `DELETE` | `/api/projects/:id/collaborators/:userId` | Remove collaborator / Leave project | Yes |

---

## Real-Time Collaboration (Socket.IO Gateway)

Gateway listens on root port (e.g. `ws://localhost:3000`).

### Client -> Server Events

1. **`join_project`**:
   - Payload: `{ projectId: string, user: { id: string, name: string, email: string, color?: string } }`
   - Description: Joins room `project_${projectId}`. Gateway tracks online participants.
   - Acknowledgement / Response: `{ status: 'ok', room, onlineUsers }`.

2. **`leave_project`**:
   - Payload: `{ projectId: string }`
   - Description: Leaves the room and removes presence.

3. **`diagram_change`**:
   - Payload: `{ projectId: string, change: any, data?: any }`
   - Description: Broadcasts diagram mutations to all other collaborators in the room. If full snapshot `data` is sent, automatically persists it to PostgreSQL.

4. **`cursor_move`**:
   - Payload: `{ projectId: string, position: { x: number, y: number } }`
   - Description: Transmits live collaborator cursor coordinates.

### Server -> Client Broadcast Events

1. **`user_joined`**: `{ user, socketId }`
2. **`user_left`**: `{ user, socketId }`
3. **`room_users`**: `UserInfo[]` (Full list of currently connected participants in the room)
4. **`diagram_change`**: `{ change, sender, socketId, timestamp }`
5. **`cursor_move`**: `{ position: { x, y }, user, socketId }`

