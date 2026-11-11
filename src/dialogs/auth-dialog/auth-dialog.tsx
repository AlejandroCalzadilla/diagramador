import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/tabs/tabs';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/spinner/spinner';

export interface AuthDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const { isAuthDialogOpen, closeAuthDialog, login, register, isLoading } =
        useAuth();

    const isOpen = open !== undefined ? open : isAuthDialogOpen;
    const handleOpenChange = (val: boolean) => {
        if (onOpenChange) {
            onOpenChange(val);
        } else if (!val) {
            closeAuthDialog();
        }
    };

    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!loginEmail || !loginPassword) {
            setError('Por favor complete todos los campos.');
            return;
        }

        try {
            await login(loginEmail, loginPassword);
            setLoginEmail('');
            setLoginPassword('');
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Error al iniciar sesión');
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!registerName || !registerEmail || !registerPassword) {
            setError('Por favor complete todos los campos.');
            return;
        }

        try {
            await register(registerEmail, registerPassword, registerName);
            setRegisterName('');
            setRegisterEmail('');
            setRegisterPassword('');
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Error al registrar la cuenta');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {activeTab === 'login'
                            ? 'Iniciar Sesión en ChartDB'
                            : 'Crear una Cuenta'}
                    </DialogTitle>
                    <DialogDescription>
                        {activeTab === 'login'
                            ? 'Accede a tus proyectos en la nube y colabora en tiempo real.'
                            : 'Crea tu cuenta para guardar proyectos y colaborar con tu equipo.'}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <Tabs
                    value={activeTab}
                    onValueChange={(val) => {
                        setActiveTab(val as 'login' | 'register');
                        setError(null);
                    }}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                        <TabsTrigger value="register">Crear Cuenta</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="mt-4">
                        <form
                            onSubmit={handleLoginSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="login-email">
                                    Correo Electrónico
                                </Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="usuario@ejemplo.com"
                                    value={loginEmail}
                                    onChange={(e) =>
                                        setLoginEmail(e.target.value)
                                    }
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-password">
                                    Contraseña
                                </Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={loginPassword}
                                    onChange={(e) =>
                                        setLoginPassword(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Spinner size="small" />
                                        <span>Iniciando sesión...</span>
                                    </div>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="register" className="mt-4">
                        <form
                            onSubmit={handleRegisterSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="register-name">
                                    Nombre Completo
                                </Label>
                                <Input
                                    id="register-name"
                                    type="text"
                                    placeholder="Tu Nombre"
                                    value={registerName}
                                    onChange={(e) =>
                                        setRegisterName(e.target.value)
                                    }
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-email">
                                    Correo Electrónico
                                </Label>
                                <Input
                                    id="register-email"
                                    type="email"
                                    placeholder="usuario@ejemplo.com"
                                    value={registerEmail}
                                    onChange={(e) =>
                                        setRegisterEmail(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-password">
                                    Contraseña
                                </Label>
                                <Input
                                    id="register-password"
                                    type="password"
                                    placeholder="Al menos 6 caracteres"
                                    value={registerPassword}
                                    onChange={(e) =>
                                        setRegisterPassword(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Spinner size="small" />
                                        <span>Creando cuenta...</span>
                                    </div>
                                ) : (
                                    'Crear Cuenta'
                                )}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
