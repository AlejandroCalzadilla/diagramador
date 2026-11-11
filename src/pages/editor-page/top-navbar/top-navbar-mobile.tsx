import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChartDBLogo from '@/assets/logo-2.png';
import { DiagramName } from './diagram-name';
import { LanguageNav } from './language-nav/language-nav';
import { Menu } from './menu/menu';
import { Button } from '@/components/button/button';
import { useSidebar } from '@/components/sidebar/use-sidebar';
import { MenuIcon, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/avatar/avatar';

export interface TopNavbarMobileProps {}

export const TopNavbarMobile: React.FC<TopNavbarMobileProps> = () => {
    const renderStars = useCallback(() => {
        return (
            <iframe
                src="https://ghbtns.com/github-btn.html?user=chartdb&repo=chartdb&type=star&size=small&text=false"
                width="25"
                height="20"
                title="GitHub"
            ></iframe>
        );
    }, []);

    const { toggleSidebar } = useSidebar();
    const { user, isAuthenticated, openAuthDialog } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="flex flex-col justify-between border-b px-3 md:h-12 md:flex-row md:items-center md:px-4">
            <div className="flex flex-1 flex-col justify-between gap-x-1 md:flex-row md:justify-normal">
                <div className="flex items-center justify-between pt-[8px] font-primary md:py-[10px]">
                    <div className="flex items-center gap-1.5">
                        <Button
                            size={'icon'}
                            variant="ghost"
                            onClick={toggleSidebar}
                        >
                            <MenuIcon className="size-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/projects')}
                            className="h-7 gap-1 px-2 text-xs"
                            title="Volver a Proyectos"
                        >
                            <ArrowLeft className="size-3" />
                            <span>Proyectos</span>
                        </Button>
                        <a
                            href="https://chartdb.io"
                            className="cursor-pointer"
                            rel="noreferrer"
                        >
                            <img
                                src={ChartDBLogo}
                                alt="chartDB"
                                className="h-4 max-w-fit"
                            />
                        </a>
                    </div>

                    <div className="flex items-center gap-2">
                        {isAuthenticated ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate('/projects')}
                                className="h-8 gap-1 p-1 text-xs"
                                title="Mis Proyectos"
                            >
                                <Avatar className="size-6">
                                    <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                        {user?.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={openAuthDialog}
                                className="h-7 px-2 text-xs"
                            >
                                <LogIn className="mr-1 size-3" />
                                Entrar
                            </Button>
                        )}
                        {renderStars()}
                        <LanguageNav />
                    </div>
                </div>
                <Menu />
            </div>

            <div className="flex flex-1 justify-center pb-2 pt-1">
                <DiagramName />
            </div>
        </nav>
    );
};
