import React, { useEffect, useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Badge } from '@/components/badge/badge';
import { useProject } from '@/hooks/use-project';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/spinner/spinner';
import {
    Users,
    UserPlus,
    Trash2,
    Crown,
    Shield,
    Edit3,
    Eye,
} from 'lucide-react';
import type { CollaboratorRole } from '@/lib/api/api-client';

export interface CollaboratorsDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const CollaboratorsDialog: React.FC<CollaboratorsDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const { user } = useAuth();
    const {
        currentProject,
        userRole,
        collaborators,
        fetchCollaborators,
        addCollaborator,
        removeCollaborator,
        isCollaboratorsDialogOpen,
        closeCollaboratorsDialog,
    } = useProject();

    const isOpen = open !== undefined ? open : isCollaboratorsDialogOpen;
    const handleOpenChange = (val: boolean) => {
        if (onOpenChange) {
            onOpenChange(val);
        } else if (!val) {
            closeCollaboratorsDialog();
        }
    };

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>(
        'editor'
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const safeCollaborators = Array.isArray(collaborators) ? collaborators : [];

    useEffect(() => {
        if (isOpen && currentProject) {
            fetchCollaborators(currentProject.id);
        }
    }, [isOpen, currentProject, fetchCollaborators]);

    const canManage = userRole === 'owner' || userRole === 'admin';

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!inviteEmail.trim()) return;

        setIsSubmitting(true);
        try {
            await addCollaborator(inviteEmail.trim(), inviteRole);
            setInviteEmail('');
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Error al invitar colaborador');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (userId: string, email?: string) => {
        if (
            window.confirm(
                `¿Deseas remover a ${email || 'este colaborador'} del proyecto?`
            )
        ) {
            try {
                await removeCollaborator(userId);
            } catch (err: unknown) {
                setError(
                    (err as Error)?.message || 'Error al remover colaborador'
                );
            }
        }
    };

    const getRoleIcon = (role: CollaboratorRole | string) => {
        switch (role) {
            case 'owner':
                return <Crown className="size-3.5 text-amber-500" />;
            case 'admin':
                return <Shield className="size-3.5 text-purple-500" />;
            case 'editor':
                return <Edit3 className="size-3.5 text-blue-500" />;
            default:
                return <Eye className="size-3.5 text-muted-foreground" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                        <Users className="size-5 text-primary" />
                        <span>Colaboradores del Proyecto</span>
                    </DialogTitle>
                    <DialogDescription>
                        {currentProject
                            ? `Gestiona los accesos y roles para "${currentProject.title}".`
                            : 'Invita a otros usuarios a colaborar en tiempo real.'}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-md bg-destructive/15 p-2.5 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Invite Form */}
                {canManage && (
                    <form
                        onSubmit={handleInvite}
                        className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 sm:flex-row"
                    >
                        <Input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                            className="flex-1"
                        />
                        <div className="flex gap-2">
                            <Select
                                value={inviteRole}
                                onValueChange={(val) =>
                                    setInviteRole(
                                        val as 'viewer' | 'editor' | 'admin'
                                    )
                                }
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">
                                        Lector
                                    </SelectItem>
                                    <SelectItem value="editor">
                                        Editor
                                    </SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting || !inviteEmail.trim()}
                                className="gap-1 whitespace-nowrap"
                            >
                                {isSubmitting ? (
                                    <Spinner size="small" />
                                ) : (
                                    <UserPlus className="size-4" />
                                )}
                                <span>Invitar</span>
                            </Button>
                        </div>
                    </form>
                )}

                {/* Collaborators List */}
                <div className="max-h-[300px] overflow-y-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Rol</TableHead>
                                {canManage && (
                                    <TableHead className="w-12 text-right" />
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Project Owner Row */}
                            {currentProject?.owner && (
                                <TableRow>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex size-7 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold text-amber-600">
                                                {currentProject.owner.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                                    <span>
                                                        {
                                                            currentProject.owner
                                                                .name
                                                        }
                                                    </span>
                                                    {currentProject.owner.id ===
                                                        user?.id && (
                                                        <span className="text-xs text-muted-foreground">
                                                            (Tú)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {currentProject.owner.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="gap-1 border-amber-500/30 bg-amber-500/10 text-xs font-normal text-amber-600"
                                        >
                                            <Crown className="size-3" />
                                            <span>Propietario</span>
                                        </Badge>
                                    </TableCell>
                                    {canManage && <TableCell />}
                                </TableRow>
                            )}

                            {/* Collaborator Rows */}
                            {safeCollaborators.map((c) => {
                                const isSelf = c.userId === user?.id;
                                return (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                    {(
                                                        c.user?.name ||
                                                        c.user?.email ||
                                                        '?'
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                                        <span>
                                                            {c.user?.name ||
                                                                'Usuario'}
                                                        </span>
                                                        {isSelf && (
                                                            <span className="text-xs text-muted-foreground">
                                                                (Tú)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {c.user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="gap-1 text-xs font-normal capitalize"
                                            >
                                                {getRoleIcon(c.role)}
                                                <span>{c.role}</span>
                                            </Badge>
                                        </TableCell>
                                        {canManage && (
                                            <TableCell className="text-right">
                                                {!isSelf && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="size-7 p-0 text-destructive hover:bg-destructive/10"
                                                        title="Remover colaborador"
                                                        onClick={() =>
                                                            handleRemove(
                                                                c.userId,
                                                                c.user?.email
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
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
