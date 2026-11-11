import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/spinner/spinner';
import { AuthPage } from './auth-page/auth-page';
import { ProjectsDashboardPage } from './projects-dashboard-page/projects-dashboard-page';

export const RootRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Spinner size="large" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <ProjectsDashboardPage />;
    }

    return <AuthPage />;
};
