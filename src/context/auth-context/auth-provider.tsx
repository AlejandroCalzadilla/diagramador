import React, { useCallback, useEffect, useState } from 'react';
import { authContext } from './auth-context';
import { apiClient, type User } from '@/lib/api/api-client';

const TOKEN_KEY = 'chartdb_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [token, setTokenState] = useState<string | null>(() => {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    });
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState<boolean>(false);

    const openAuthDialog = useCallback(() => setIsAuthDialogOpen(true), []);
    const closeAuthDialog = useCallback(() => setIsAuthDialogOpen(false), []);

    const refreshUser = useCallback(async () => {
        const currentToken = localStorage.getItem(TOKEN_KEY);
        if (!currentToken) {
            setUser(null);
            setTokenState(null);
            setIsLoading(false);
            return;
        }

        try {
            const userData = await apiClient.getMe();
            setUser(userData);
            setTokenState(currentToken);
        } catch (error) {
            console.warn(
                'Failed to rehydrate authenticated user, logging out',
                error
            );
            apiClient.setToken(null);
            setUser(null);
            setTokenState(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.login(email, password);
            setTokenState(response.accessToken);
            setUser(response.user);
            setIsAuthDialogOpen(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(
        async (email: string, password: string, name: string) => {
            setIsLoading(true);
            try {
                const response = await apiClient.register(
                    email,
                    password,
                    name
                );
                setTokenState(response.accessToken);
                setUser(response.user);
                setIsAuthDialogOpen(false);
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const logout = useCallback(() => {
        apiClient.setToken(null);
        setTokenState(null);
        setUser(null);
    }, []);

    return (
        <authContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                register,
                logout,
                refreshUser,
                isAuthDialogOpen,
                openAuthDialog,
                closeAuthDialog,
            }}
        >
            {children}
        </authContext.Provider>
    );
};
