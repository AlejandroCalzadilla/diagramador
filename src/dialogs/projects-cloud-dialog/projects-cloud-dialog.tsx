import React, { useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/table/table';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Badge } from '@/components/badge/badge';
import { useProject } from '@/hooks/use-project';
import { Spinner } from '@/components/spinner/spinner';
import {
    Cloud,
    FolderPlus,
    Users,
    Trash2,
    FolderOpen,
    Plus,
    Check,
} from 'lucide-react';
import type { CollaboratorRole } from '@/lib/api/api-client';

export interface ProjectsCloudDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const getRoleBadgeVariant = (role?: CollaboratorRole | string) => {
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

export const ProjectsCloudDialog: React.FC<ProjectsCloudDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const {
        isProjectsDialogOpen,
        closeProjectsDialog,
        cloudProjects,
        isLoadingProjects,
        loadProject,
        createProject,
        deleteProject,
        currentProject,
        openCollaboratorsDialog,
    } = useProject();

    const isOpen = open !== undefined ? open : isProjectsDialogOpen;
    const handleOpenChange = (val: boolean) => {
        if (onOpenChange) {
            onOpenChange(val);
        } else if (!val) {
            closeProjectsDialog();
        }
    };

    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [creatingLoading, setCreatingLoading] = useState(false);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setCreatingLoading(true);
        try {
            await createProject(
                newTitle.trim(),
                newDescription.trim() || undefined
            );
            setNewTitle('');
            setNewDescription('');
            setIsCreating(false);
            closeProjectsDialog();
        } finally {
            setCreatingLoading(false);
        }
    };

    const handleOpenProject = async (id: string) => {
        await loadProject(id);
        closeProjectsDialog();
    };

    const handleOpenCollabs = async (id: string) => {
        if (currentProject?.id !== id) {
            await loadProject(id);
        }
        closeProjectsDialog();
        openCollaboratorsDialog();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                        <Cloud className="size-5 text-primary" />
                        <span>Proyectos en la Nube</span>
                    </DialogTitle>
                    <DialogDescription>
                        Gestiona tus proyectos centralizados en PostgreSQL con
                        colaboración en tiempo real.
                    </DialogDescription>
                </DialogHeader>

                {/* Create Project Section */}
                <div className="border-b pb-4">
                    {!isCreating ? (
                        <Button
                            onClick={() => setIsCreating(true)}
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <FolderPlus className="size-4" />
                            <span>Nuevo Proyecto en la Nube</span>
                        </Button>
                    ) : (
                        <form
                            onSubmit={handleCreateProject}
                            className="space-y-3 rounded-lg border bg-muted/40 p-3"
                        >
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span>Crear nuevo proyecto en la nube</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCreating(false)}
                                >
                                    Cancelar
                                </Button>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <Input
                                    placeholder="Nombre del proyecto (ej: E-commerce DB)"
                                    value={newTitle}
                                    onChange={(e) =>
                                        setNewTitle(e.target.value)
                                    }
                                    required
                                    autoFocus
                                />
                                <Input
                                    placeholder="Descripción (opcional)"
                                    value={newDescription}
                                    onChange={(e) =>
                                        setNewDescription(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={
                                        creatingLoading || !newTitle.trim()
                                    }
                                >
                                    {creatingLoading ? (
                                        <Spinner size="small" />
                                    ) : (
                                        <Plus className="mr-1 size-4" />
                                    )}
                                    Crear y Abrir
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Projects Table */}
                <div className="max-h-[350px] overflow-y-auto rounded-md border">
                    {isLoadingProjects ? (
                        <div className="flex h-36 items-center justify-center">
                            <Spinner size="medium" />
                        </div>
                    ) : cloudProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Cloud className="mb-2 size-10 opacity-30" />
                            <p className="text-sm font-medium">
                                No tienes proyectos en la nube aún.
                            </p>
                            <p className="text-xs">
                                Crea uno para almacenar y sincronizar esquemas
                                en tiempo real.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead className="hidden sm:table-cell">
                                        Última modificación
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cloudProjects.map((proj) => {
                                    const isCurrent =
                                        currentProject?.id === proj.id;
                                    const isOwner =
                                        proj.userRole === 'owner' ||
                                        proj.ownerId === proj.owner?.id;

                                    return (
                                        <TableRow
                                            key={proj.id}
                                            className={
                                                isCurrent ? 'bg-accent/40' : ''
                                            }
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {isCurrent && (
                                                        <span
                                                            title="Proyecto activo actual"
                                                            className="flex size-2 rounded-full bg-emerald-500"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-foreground">
                                                            {proj.title}
                                                        </div>
                                                        {proj.description && (
                                                            <div className="line-clamp-1 text-xs text-muted-foreground">
                                                                {
                                                                    proj.description
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`border text-xs font-normal ${getRoleBadgeVariant(proj.userRole)}`}
                                                >
                                                    {getRoleLabel(
                                                        proj.userRole
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                                                {new Date(
                                                    proj.updatedAt
                                                ).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant={
                                                            isCurrent
                                                                ? 'outline'
                                                                : 'default'
                                                        }
                                                        size="sm"
                                                        className="h-8 gap-1 px-2.5 text-xs"
                                                        onClick={() =>
                                                            handleOpenProject(
                                                                proj.id
                                                            )
                                                        }
                                                    >
                                                        {isCurrent ? (
                                                            <>
                                                                <Check className="size-3 text-emerald-500" />
                                                                <span>
                                                                    Abierto
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FolderOpen className="size-3" />
                                                                <span>
                                                                    Abrir
                                                                </span>
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 gap-1 px-2 text-xs"
                                                        title="Colaboradores"
                                                        onClick={() =>
                                                            handleOpenCollabs(
                                                                proj.id
                                                            )
                                                        }
                                                    >
                                                        <Users className="size-3.5 text-muted-foreground" />
                                                    </Button>
                                                    {isOwner && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-destructive hover:bg-destructive/10"
                                                            title="Eliminar proyecto"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        `¿Estás seguro de eliminar "${proj.title}"?`
                                                                    )
                                                                ) {
                                                                    deleteProject(
                                                                        proj.id
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    <DialogClose asChild>
                        <Button variant="outline" size="sm">
                            Cerrar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
