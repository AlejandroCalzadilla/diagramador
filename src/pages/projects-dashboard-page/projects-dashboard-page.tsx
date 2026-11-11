import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useProject } from '@/hooks/use-project';
import type { CloudProject, CollaboratorRole } from '@/lib/api/api-client';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { Avatar, AvatarFallback } from '@/components/avatar/avatar';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Spinner } from '@/components/spinner/spinner';
import {
    Plus,
    Search,
    FolderPlus,
    Users,
    Trash2,
    LayoutDashboard,
    LogOut,
    Calendar,
    ArrowRight,
    RefreshCw,
    Database,
} from 'lucide-react';

const getRoleBadgeClass = (role?: CollaboratorRole | string) => {
    switch (role) {
        case 'owner':
            return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
        case 'admin':
            return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
        case 'editor':
            return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
        case 'viewer':
        default:
            return 'bg-muted text-muted-foreground border-border';
    }
};

const getRoleLabel = (role?: CollaboratorRole | string) => {
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

export const ProjectsDashboardPage: React.FC = () => {
    const { effectiveTheme } = useTheme();
    const {
        user,
        isAuthenticated,
        isLoading: isAuthLoading,
        logout,
    } = useAuth();
    const {
        cloudProjects,
        isLoadingProjects,
        refreshProjects,
        loadProject,
        createProject,
        deleteProject,
        openCollaboratorsDialog,
        currentProject,
    } = useProject();
    const navigate = useNavigate();

    // Guard authentication
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, isAuthLoading, navigate]);

    // Modal state for creating project
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Search and filter
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) return cloudProjects;
        const q = searchQuery.toLowerCase();
        return cloudProjects.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q))
        );
    }, [cloudProjects, searchQuery]);

    const getProjectRole = (project: CloudProject): CollaboratorRole => {
        if (project.ownerId === user?.id) return 'owner';
        if (project.userRole) return project.userRole;
        const collab = project.collaborators?.find(
            (c) => c.userId === user?.id
        );
        return collab?.role || 'viewer';
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        if (!newTitle.trim()) {
            setCreateError('El título del proyecto es obligatorio.');
            return;
        }

        setIsCreating(true);
        try {
            const project = await createProject(
                newTitle.trim(),
                newDescription.trim() || undefined
            );
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewDescription('');
            // Navigate straight to the editor with this project
            navigate(`/editor/${project.id}`);
        } catch (err: unknown) {
            setCreateError(
                (err as Error)?.message || 'Error al crear el proyecto'
            );
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpenProject = async (id: string) => {
        setActionLoadingId(id);
        try {
            await loadProject(id);
            navigate(`/editor/${id}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleOpenCollaborators = async (id: string) => {
        setActionLoadingId(id);
        try {
            if (currentProject?.id !== id) {
                await loadProject(id);
            }
            openCollaboratorsDialog();
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteProject = async (project: CloudProject) => {
        if (
            window.confirm(
                `¿Estás seguro de que deseas eliminar el proyecto "${project.title}"? Esta acción no se puede deshacer.`
            )
        ) {
            setActionLoadingId(project.id);
            try {
                await deleteProject(project.id);
            } finally {
                setActionLoadingId(null);
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    if (isAuthLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Spinner size="large" />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>ChartDB - Mis Proyectos</title>
            </Helmet>
            <div className="flex min-h-screen flex-col bg-background text-foreground">
                {/* Top Header */}
                <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <img
                                src={
                                    effectiveTheme === 'light'
                                        ? ChartDBLogo
                                        : ChartDBDarkLogo
                                }
                                alt="ChartDB"
                                className="h-6 w-auto sm:h-7"
                            />
                            <Badge
                                variant="outline"
                                className="hidden border-primary/30 bg-primary/10 text-xs font-semibold text-primary sm:inline-flex"
                            >
                                Cloud Dashboard
                            </Badge>
                        </div>

                        {/* User info & Logout */}
                        <div className="flex items-center gap-3">
                            {user && (
                                <div className="flex items-center gap-2.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 shadow-sm">
                                    <Avatar className="size-7">
                                        <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                                            {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden flex-col text-left sm:flex">
                                        <span className="text-xs font-semibold leading-tight text-foreground">
                                            {user.name}
                                        </span>
                                        <span className="text-[10px] leading-tight text-muted-foreground">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                                title="Cerrar sesión"
                            >
                                <LogOut className="size-4" />
                                <span className="hidden sm:inline">
                                    Cerrar sesión
                                </span>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                    {/* Hero and actions row */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                <LayoutDashboard className="size-7 text-primary" />
                                <span>Mis Proyectos</span>
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Gestiona tus diagramas de base de datos,
                                colabora con tu equipo o crea un nuevo proyecto.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refreshProjects()}
                                disabled={isLoadingProjects}
                                className="h-9 gap-1.5 text-xs font-medium"
                                title="Recargar proyectos"
                            >
                                <RefreshCw
                                    className={`size-3.5 ${isLoadingProjects ? 'animate-spin' : ''}`}
                                />
                                <span className="hidden sm:inline">
                                    Actualizar
                                </span>
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="h-9 gap-2 text-xs font-semibold shadow-md"
                            >
                                <Plus className="size-4" />
                                <span>Nuevo Proyecto</span>
                            </Button>
                        </div>
                    </div>

                    {/* Search bar & Project count */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar proyectos por nombre o descripción..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 text-xs sm:text-sm"
                            />
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">
                            {cloudProjects.length === 1
                                ? '1 proyecto registrado'
                                : `${cloudProjects.length} proyectos registrados`}
                        </div>
                    </div>

                    {/* Content Section: Loading, Empty, or Grid */}
                    <div className="mt-8">
                        {isLoadingProjects && cloudProjects.length === 0 ? (
                            <div className="flex h-64 flex-col items-center justify-center gap-3">
                                <Spinner size="large" />
                                <p className="text-xs text-muted-foreground">
                                    Cargando proyectos en la nube...
                                </p>
                            </div>
                        ) : cloudProjects.length === 0 ? (
                            /* Empty state: No projects created yet */
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-12 text-center shadow-sm">
                                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <FolderPlus className="size-7" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-foreground">
                                    No tienes proyectos todavía
                                </h3>
                                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                                    Crea tu primer proyecto para comenzar a
                                    diseñar y modelar diagramas de bases de
                                    datos centralizados.
                                </p>
                                <Button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="mt-6 gap-2"
                                >
                                    <Plus className="size-4" />
                                    <span>Crear mi primer proyecto</span>
                                </Button>
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            /* Empty state: No projects matching search */
                            <div className="flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card/30 p-10 text-center">
                                <Database className="size-8 text-muted-foreground/60" />
                                <h3 className="mt-3 text-base font-medium text-foreground">
                                    Sin coincidencias
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    No se encontraron proyectos con el término "
                                    {searchQuery}".
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchQuery('')}
                                    className="mt-4 text-xs"
                                >
                                    Limpiar búsqueda
                                </Button>
                            </div>
                        ) : (
                            /* Projects Grid */
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredProjects.map((project) => {
                                    const role = getProjectRole(project);
                                    const isOwner = role === 'owner';
                                    const isLoading =
                                        actionLoadingId === project.id;

                                    return (
                                        <Card
                                            key={project.id}
                                            className="group flex flex-col justify-between border-border/80 bg-card/80 transition-all hover:border-primary/50 hover:shadow-lg"
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <CardTitle className="truncate text-base font-semibold text-foreground group-hover:text-primary">
                                                        {project.title}
                                                    </CardTitle>
                                                    <Badge
                                                        variant="outline"
                                                        className={`shrink-0 text-[11px] font-medium uppercase tracking-wider ${getRoleBadgeClass(role)}`}
                                                    >
                                                        {getRoleLabel(role)}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="line-clamp-2 min-h-10 pt-1 text-xs text-muted-foreground">
                                                    {project.description || (
                                                        <span className="italic text-muted-foreground/60">
                                                            Sin descripción
                                                        </span>
                                                    )}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="space-y-2 pb-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="size-3.5 text-muted-foreground/80" />
                                                    <span>
                                                        Actualizado:{' '}
                                                        {new Date(
                                                            project.updatedAt
                                                        ).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            }
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <Users className="size-3.5 text-muted-foreground/80" />
                                                    <span>
                                                        {project.collaborators
                                                            ?.length ?? 1}{' '}
                                                        {project.collaborators
                                                            ?.length === 1
                                                            ? 'colaborador'
                                                            : 'colaboradores'}
                                                    </span>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/20 p-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleOpenProject(
                                                                project.id
                                                            )
                                                        }
                                                        disabled={isLoading}
                                                        className="h-8 gap-1.5 px-3 text-xs font-semibold"
                                                    >
                                                        {isLoading ? (
                                                            <Spinner size="small" />
                                                        ) : (
                                                            <>
                                                                <span>
                                                                    Abrir
                                                                    Pizarra
                                                                </span>
                                                                <ArrowRight className="size-3.5" />
                                                            </>
                                                        )}
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleOpenCollaborators(
                                                                project.id
                                                            )
                                                        }
                                                        disabled={isLoading}
                                                        className="h-8 gap-1 px-2.5 text-xs"
                                                        title="Gestionar colaboradores"
                                                    >
                                                        <Users className="size-3.5" />
                                                        <span className="hidden sm:inline">
                                                            Colaboradores
                                                        </span>
                                                    </Button>
                                                </div>

                                                {isOwner && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDeleteProject(
                                                                project
                                                            )
                                                        }
                                                        disabled={isLoading}
                                                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                        title="Eliminar proyecto"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>

                {/* Create Project Modal */}
                <Dialog
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                >
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Plus className="size-5 text-primary" />
                                <span>Nuevo Proyecto en la Nube</span>
                            </DialogTitle>
                            <DialogDescription>
                                Configura el nombre y la descripción para tu
                                nuevo esquema de base de datos.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={handleCreateProject}
                            className="space-y-4"
                        >
                            {createError && (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                                    {createError}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="new-project-title">
                                    Nombre del Proyecto *
                                </Label>
                                <Input
                                    id="new-project-title"
                                    placeholder="Ej: Base de Datos Comercio Electrónico"
                                    value={newTitle}
                                    onChange={(e) =>
                                        setNewTitle(e.target.value)
                                    }
                                    autoFocus
                                    required
                                    disabled={isCreating}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="new-project-desc">
                                    Descripción (Opcional)
                                </Label>
                                <Input
                                    id="new-project-desc"
                                    placeholder="Ej: Esquema relacional para órdenes, usuarios y pagos."
                                    value={newDescription}
                                    onChange={(e) =>
                                        setNewDescription(e.target.value)
                                    }
                                    disabled={isCreating}
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isCreating}
                                    >
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={isCreating || !newTitle.trim()}
                                    className="gap-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <Spinner size="small" />
                                            <span>Creando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="size-4" />
                                            <span>Crear y Abrir Pizarra</span>
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};
