import { createContext } from 'react';
import type { User } from '@/lib/api/api-client';

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthDialogOpen: boolean;
    openAuthDialog: () => void;
    closeAuthDialog: () => void;
}

export const authContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    refreshUser: async () => {},
    isAuthDialogOpen: false,
    openAuthDialog: () => {},
    closeAuthDialog: () => {},
});
