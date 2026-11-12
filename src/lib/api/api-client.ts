export interface User {
    id: string;
    email: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export type CollaboratorRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ProjectCollaborator {
    id: string;
    projectId: string;
    userId: string;
    role: CollaboratorRole;
    createdAt: string;
    user?: User;
}

export interface CloudProject {
    id: string;
    title: string;
    description?: string;
    data?: unknown;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    owner?: User;
    collaborators?: ProjectCollaborator[];
    userRole?: CollaboratorRole;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}

const TOKEN_KEY = 'chartdb_token';

export class ApiClient {
    private baseUrl: string;

    constructor() {
        const envUrl =
            (typeof window !== 'undefined' && window.env?.API_URL) ||
            import.meta.env.VITE_API_URL;

        if (envUrl) {
            this.baseUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
        } else if (
            typeof window !== 'undefined' &&
            window.location.hostname.includes('onrender.com')
        ) {
            this.baseUrl = 'https://diagramador-1.onrender.com/api';
        } else {
            const defaultHost =
                typeof window !== 'undefined' && window.location.hostname
                    ? window.location.hostname
                    : 'localhost';
            this.baseUrl = `http://${defaultHost}:3000/api`;
        }
    }

    private getToken(): string | null {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    }

    public setToken(token: string | null) {
        try {
            if (token) {
                localStorage.setItem(TOKEN_KEY, token);
            } else {
                localStorage.removeItem(TOKEN_KEY);
            }
        } catch (e) {
            console.error('Failed to update auth token in storage', e);
        }
    }

    private async request<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        const token = this.getToken();
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorMsg = response.statusText;
            try {
                const errorData = await response.json();
                if (Array.isArray(errorData.message)) {
                    errorMsg = errorData.message.join(', ');
                } else if (errorData.message) {
                    errorMsg = errorData.message;
                }
            } catch {
                // Ignore parse errors and use default statusText
            }
            throw new Error(
                errorMsg || `Request failed with status ${response.status}`
            );
        }

        // Return empty or parsed JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        return {} as T;
    }

    // Auth methods
    async register(
        email: string,
        password: string,
        name: string
    ): Promise<AuthResponse> {
        const data = await this.request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        if (data.accessToken) {
            this.setToken(data.accessToken);
        }
        return data;
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        const data = await this.request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.accessToken) {
            this.setToken(data.accessToken);
        }
        return data;
    }

    async getMe(): Promise<User> {
        return this.request<User>('/auth/me', {
            method: 'GET',
        });
    }

    // Project methods
    async listProjects(): Promise<CloudProject[]> {
        return this.request<CloudProject[]>('/projects', {
            method: 'GET',
        });
    }

    async getProject(id: string): Promise<CloudProject> {
        return this.request<CloudProject>(`/projects/${id}`, {
            method: 'GET',
        });
    }

    async createProject(
        title: string,
        description?: string,
        data?: unknown
    ): Promise<CloudProject> {
        return this.request<CloudProject>('/projects', {
            method: 'POST',
            body: JSON.stringify({ title, description, data }),
        });
    }

    async updateProject(
        id: string,
        payload: { title?: string; description?: string; data?: unknown }
    ): Promise<CloudProject> {
        return this.request<CloudProject>(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deleteProject(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/projects/${id}`, {
            method: 'DELETE',
        });
    }

    // Collaborator methods
    async listCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
        const response = await this.request<
            | { owner?: unknown; collaborators?: ProjectCollaborator[] }
            | ProjectCollaborator[]
        >(`/projects/${projectId}/collaborators`, {
            method: 'GET',
        });

        if (Array.isArray(response)) {
            return response;
        }
        if (response && Array.isArray(response.collaborators)) {
            return response.collaborators;
        }
        return [];
    }

    async addCollaborator(
        projectId: string,
        email: string,
        role: 'viewer' | 'editor' | 'admin'
    ): Promise<ProjectCollaborator> {
        return this.request<ProjectCollaborator>(
            `/projects/${projectId}/collaborators`,
            {
                method: 'POST',
                body: JSON.stringify({ email, role }),
            }
        );
    }

    async removeCollaborator(
        projectId: string,
        userId: string
    ): Promise<{ message: string }> {
        return this.request<{ message: string }>(
            `/projects/${projectId}/collaborators/${userId}`,
            {
                method: 'DELETE',
            }
        );
    }
}

export const apiClient = new ApiClient();
