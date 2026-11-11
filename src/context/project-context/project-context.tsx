import { createContext } from 'react';
import type {
    CloudProject,
    CollaboratorRole,
    ProjectCollaborator,
} from '@/lib/api/api-client';

export interface RoomUser {
    id: string;
    name: string;
    email: string;
    color?: string;
    avatar?: string;
}

export interface DiagramHandlers {
    loadDiagram: (data: unknown) => void;
    getCurrentDiagram: () => unknown;
}

export interface ProjectContextType {
    currentProject: CloudProject | null;
    userRole: CollaboratorRole | null;
    collaborators: ProjectCollaborator[];
    activeRoomUsers: RoomUser[];
    cloudProjects: CloudProject[];
    isLoadingProjects: boolean;

    // Dialog toggles
    isProjectsDialogOpen: boolean;
    openProjectsDialog: () => void;
    closeProjectsDialog: () => void;
    isCollaboratorsDialogOpen: boolean;
    openCollaboratorsDialog: () => void;
    closeCollaboratorsDialog: () => void;

    // Project operations
    refreshProjects: () => Promise<CloudProject[]>;
    loadProject: (id: string) => Promise<CloudProject>;
    saveCurrentProject: (diagramData?: unknown) => Promise<void>;
    createProject: (
        title: string,
        description?: string,
        data?: unknown
    ) => Promise<CloudProject>;
    deleteProject: (id: string) => Promise<void>;
    switchProject: (id: string | null) => Promise<void>;

    // Collaborators
    fetchCollaborators: (projectId?: string) => Promise<ProjectCollaborator[]>;
    addCollaborator: (
        email: string,
        role: 'viewer' | 'editor' | 'admin'
    ) => Promise<ProjectCollaborator>;
    removeCollaborator: (userId: string) => Promise<void>;

    // WebSocket / sync
    broadcastDiagramChange: (diagramData: unknown) => void;
    registerDiagramHandlers: (handlers: DiagramHandlers) => () => void;
}

export const projectContext = createContext<ProjectContextType>({
    currentProject: null,
    userRole: null,
    collaborators: [],
    activeRoomUsers: [],
    cloudProjects: [],
    isLoadingProjects: false,

    isProjectsDialogOpen: false,
    openProjectsDialog: () => {},
    closeProjectsDialog: () => {},
    isCollaboratorsDialogOpen: false,
    openCollaboratorsDialog: () => {},
    closeCollaboratorsDialog: () => {},

    refreshProjects: async () => [],
    loadProject: async () => ({}) as CloudProject,
    saveCurrentProject: async () => {},
    createProject: async () => ({}) as CloudProject,
    deleteProject: async () => {},
    switchProject: async () => {},

    fetchCollaborators: async () => [],
    addCollaborator: async () => ({}) as ProjectCollaborator,
    removeCollaborator: async () => {},

    broadcastDiagramChange: () => {},
    registerDiagramHandlers: () => () => {},
});
