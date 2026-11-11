import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { DiagramName } from './diagram-name';
import { LastSaved } from './last-saved';
import { LanguageNav } from './language-nav/language-nav';
import { Menu } from './menu/menu';
import { useAuth } from '@/hooks/use-auth';
import { useProject } from '@/hooks/use-project';
import { Button } from '@/components/button/button';
import { Badge } from '@/components/badge/badge';
import { Avatar, AvatarFallback } from '@/components/avatar/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { ArrowLeft, Users, LogIn, LogOut, LayoutDashboard } from 'lucide-react';

export interface TopNavbarProps {}

const getRoleLabel = (role?: string | null) => {
    switch (role) {
        case 'owner':
            return 'Propietario';
        case 'admin':
            return 'Admin';
        case 'editor':
            return 'Editor';
        case 'viewer':
            return 'Lector';
        default:
            return role || 'Lector';
    }
};

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    const { effectiveTheme } = useTheme();
    const { user, isAuthenticated, logout, openAuthDialog } = useAuth();
    const {
        currentProject,
        userRole,
        activeRoomUsers,
        openCollaboratorsDialog,
    } = useProject();
    const navigate = useNavigate();

    const renderStars = useCallback(() => {
        return (
            <iframe
                src={`https://ghbtns.com/github-btn.html?user=chartdb&repo=chartdb&type=star&size=large&text=false`}
                width="40"
                height="30"
                title="GitHub"
            ></iframe>
        );
    }, []);

    const handleBackToProjects = () => {
        navigate('/projects');
    };

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    return (
        <nav className="flex flex-col justify-between border-b px-3 md:h-12 md:flex-row md:items-center md:px-4">
            <div className="flex flex-1 items-center gap-x-2">
                <div className="flex items-center justify-between pt-[8px] font-primary md:py-[10px]">
                    <a
                        href="https://chartdb.io"
                        className="cursor-pointer"
                        rel="noreferrer"
                    >
                        <img
                            src={
                                effectiveTheme === 'light'
                                    ? ChartDBLogo
                                    : ChartDBDarkLogo
                            }
                            alt="chartDB"
                            className="h-4 max-w-fit"
                        />
                    </a>
                </div>

                {/* Return to projects dashboard button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToProjects}
                    className="h-8 gap-1.5 border-border/80 px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                    title="Volver al panel de proyectos"
                >
                    <ArrowLeft className="size-3.5" />
                    <span className="hidden sm:inline">Volver a Proyectos</span>
                    <span className="sm:hidden">Proyectos</span>
                </Button>

                <Menu />

                {/* Current Project / Local Indicator */}
                {isAuthenticated && currentProject ? (
                    <div className="hidden items-center gap-1.5 xl:flex">
                        <Badge
                            variant="outline"
                            className="flex items-center gap-1.5 border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                            <span className="max-w-[140px] truncate font-medium">
                                {currentProject.title}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                ({getRoleLabel(userRole)})
                            </span>
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openCollaboratorsDialog}
                            className="h-7 gap-1 px-2.5 text-xs hover:border-primary/50"
                            title="Colaboradores del proyecto"
                        >
                            <Users className="size-3.5 text-primary" />
                            <span>Compartir</span>
                        </Button>
                    </div>
                ) : null}
            </div>

            <DiagramName />

            <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
                {/* Active room online users avatars */}
                {activeRoomUsers.length > 0 && (
                    <div
                        className="mr-1 flex items-center -space-x-1.5"
                        title={`${activeRoomUsers.length} en línea`}
                    >
                        {activeRoomUsers.slice(0, 4).map((roomUser) => (
                            <Tooltip key={roomUser.id}>
                                <TooltipTrigger asChild>
                                    <div
                                        className="flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-white shadow-sm ring-1 ring-border/20"
                                        style={{
                                            backgroundColor:
                                                roomUser.color || '#3B82F6',
                                        }}
                                    >
                                        {roomUser.name.charAt(0).toUpperCase()}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p className="text-xs font-medium">
                                        {roomUser.name}{' '}
                                        {roomUser.id === user?.id ? '(Tú)' : ''}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {roomUser.email}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                        {activeRoomUsers.length > 4 && (
                            <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground shadow-sm">
                                +{activeRoomUsers.length - 4}
                            </div>
                        )}
                    </div>
                )}

                <LastSaved />
                {renderStars()}
                <LanguageNav />

                {/* User Auth Profile / Login */}
                {isAuthenticated && user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="relative flex items-center gap-1.5 rounded-full p-1 pl-2 text-xs font-medium hover:bg-accent"
                            >
                                <span className="max-w-[90px] truncate">
                                    {user.name}
                                </span>
                                <Avatar className="size-7">
                                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                        {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user.name}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleBackToProjects}
                                className="cursor-pointer gap-2"
                            >
                                <LayoutDashboard className="size-4" />
                                <span>Mis Proyectos</span>
                            </DropdownMenuItem>
                            {currentProject && (
                                <DropdownMenuItem
                                    onClick={openCollaboratorsDialog}
                                    className="cursor-pointer gap-2"
                                >
                                    <Users className="size-4" />
                                    <span>Gestionar Colaboradores</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                            >
                                <LogOut className="size-4" />
                                <span>Cerrar sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={openAuthDialog}
                        className="h-8 gap-1.5 text-xs font-medium"
                    >
                        <LogIn className="size-3.5" />
                        <span>Iniciar sesión</span>
                    </Button>
                )}
            </div>
        </nav>
    );
};
