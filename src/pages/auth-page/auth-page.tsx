import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/tabs/tabs';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { Spinner } from '@/components/spinner/spinner';
import {
    Database,
    Users,
    Shield,
    LogIn,
    UserPlus,
    AlertCircle,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
    const { effectiveTheme } = useTheme();
    const { isAuthenticated, isLoading, login, register } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If authenticated, automatically redirect to projects dashboard
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            navigate('/projects', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!loginEmail.trim() || !loginPassword) {
            setError('Por favor complete todos los campos.');
            return;
        }

        setIsSubmitting(true);
        try {
            await login(loginEmail.trim(), loginPassword);
            navigate('/projects', { replace: true });
        } catch (err: unknown) {
            setError(
                (err as Error)?.message ||
                    'Credenciales inválidas o error de conexión.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (
            !registerName.trim() ||
            !registerEmail.trim() ||
            !registerPassword
        ) {
            setError('Por favor complete todos los campos.');
            return;
        }

        if (registerPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setIsSubmitting(true);
        try {
            await register(
                registerEmail.trim(),
                registerPassword,
                registerName.trim()
            );
            navigate('/projects', { replace: true });
        } catch (err: unknown) {
            setError(
                (err as Error)?.message ||
                    'Error al registrar la cuenta. Verifique sus datos.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Spinner size="large" />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>ChartDB - Iniciar Sesión / Registro</title>
            </Helmet>
            <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background/95 to-muted/40 p-4 md:p-8">
                {/* Background decorative aura */}
                <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 right-1/4 -z-10 size-80 rounded-full bg-indigo-500/10 blur-3xl" />

                {/* Hero / Brand Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex items-center justify-center">
                        <img
                            src={
                                effectiveTheme === 'light'
                                    ? ChartDBLogo
                                    : ChartDBDarkLogo
                            }
                            alt="ChartDB"
                            className="h-9 w-auto md:h-11"
                        />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Modelado y Colaboración de Bases de Datos
                    </h1>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
                        Diseña esquemas visuales, sincroniza en la nube con
                        PostgreSQL y colabora en tiempo real con tu equipo.
                    </p>
                </div>

                {/* Main Auth Card */}
                <Card className="w-full max-w-md border-border/80 bg-card/90 shadow-2xl backdrop-blur-md">
                    <CardHeader className="space-y-1 pb-4 text-center">
                        <CardTitle className="text-xl font-semibold">
                            {activeTab === 'login'
                                ? 'Iniciar Sesión'
                                : 'Crear una Cuenta'}
                        </CardTitle>
                        <CardDescription>
                            {activeTab === 'login'
                                ? 'Ingresa tus credenciales para acceder a tus proyectos.'
                                : 'Crea una cuenta nueva para comenzar a diseñar.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Tabs
                            value={activeTab}
                            onValueChange={(val) => {
                                setError(null);
                                setActiveTab(val as 'login' | 'register');
                            }}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger
                                    value="login"
                                    className="gap-2 font-medium"
                                >
                                    <LogIn className="size-4" />
                                    <span>Iniciar Sesión</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="register"
                                    className="gap-2 font-medium"
                                >
                                    <UserPlus className="size-4" />
                                    <span>Registrarse</span>
                                </TabsTrigger>
                            </TabsList>

                            {error && (
                                <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <TabsContent value="login" className="mt-4">
                                <form
                                    onSubmit={handleLoginSubmit}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5 text-left">
                                        <Label htmlFor="login-email">
                                            Correo electrónico
                                        </Label>
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="nombre@empresa.com"
                                            value={loginEmail}
                                            onChange={(e) =>
                                                setLoginEmail(e.target.value)
                                            }
                                            autoFocus
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="login-password">
                                                Contraseña
                                            </Label>
                                        </div>
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={loginPassword}
                                            onChange={(e) =>
                                                setLoginPassword(e.target.value)
                                            }
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full gap-2"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Spinner size="small" />
                                                <span>Iniciando sesión...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="size-4" />
                                                <span>Entrar a ChartDB</span>
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="register" className="mt-4">
                                <form
                                    onSubmit={handleRegisterSubmit}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5 text-left">
                                        <Label htmlFor="register-name">
                                            Nombre completo
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
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <Label htmlFor="register-email">
                                            Correo electrónico
                                        </Label>
                                        <Input
                                            id="register-email"
                                            type="email"
                                            placeholder="nombre@empresa.com"
                                            value={registerEmail}
                                            onChange={(e) =>
                                                setRegisterEmail(e.target.value)
                                            }
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <Label htmlFor="register-password">
                                            Contraseña
                                        </Label>
                                        <Input
                                            id="register-password"
                                            type="password"
                                            placeholder="Mínimo 6 caracteres"
                                            value={registerPassword}
                                            onChange={(e) =>
                                                setRegisterPassword(
                                                    e.target.value
                                                )
                                            }
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full gap-2"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Spinner size="small" />
                                                <span>Creando cuenta...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="size-4" />
                                                <span>Crear Cuenta Gratis</span>
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>

                    <CardFooter className="flex flex-col border-t border-border/50 pt-4 text-center">
                        <div className="text-xs text-muted-foreground">
                            {activeTab === 'login' ? (
                                <span>
                                    ¿Aún no tienes cuenta?{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError(null);
                                            setActiveTab('register');
                                        }}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        Regístrate gratis
                                    </button>
                                </span>
                            ) : (
                                <span>
                                    ¿Ya tienes una cuenta registrada?{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError(null);
                                            setActiveTab('login');
                                        }}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        Inicia sesión aquí
                                    </button>
                                </span>
                            )}
                        </div>
                    </CardFooter>
                </Card>

                {/* Features Pills */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
                        <Database className="size-3.5 text-primary" />
                        <span>PostgreSQL Cloud</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
                        <Users className="size-3.5 text-primary" />
                        <span>Colaboración en Tiempo Real</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
                        <Shield className="size-3.5 text-primary" />
                        <span>Roles y Permisos Seguros</span>
                    </div>
                </div>
            </div>
        </>
    );
};
