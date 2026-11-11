import { useChartDB } from '@/hooks/use-chartdb';
import { useConfig } from '@/hooks/use-config';
import { useDialog } from '@/hooks/use-dialog';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { useStorage } from '@/hooks/use-storage';
import { useAuth } from '@/hooks/use-auth';
import { useProject } from '@/hooks/use-project';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const useDiagramLoader = () => {
    const [initialDiagram, setInitialDiagram] = useState<Diagram | undefined>();
    const { diagramId, projectId } = useParams<{
        diagramId?: string;
        projectId?: string;
    }>();
    const { config } = useConfig();
    const { loadDiagram, currentDiagram, loadDiagramFromData } = useChartDB();
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { showLoader, hideLoader } = useFullScreenLoader();
    const { openCreateDiagramDialog, openOpenDiagramDialog } = useDialog();
    const navigate = useNavigate();
    const { listDiagrams } = useStorage();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentProject, loadProject } = useProject();

    const currentDiagramLoadingRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        // If loading projectId, handle cloud project flow
        if (projectId) {
            if (isAuthLoading) {
                return;
            }

            if (!isAuthenticated) {
                navigate('/', { replace: true });
                return;
            }

            if (
                currentDiagramLoadingRef.current === projectId &&
                currentDiagram?.id === projectId
            ) {
                return;
            }

            const loadCloudProjectDiagram = async () => {
                showLoader();
                resetRedoStack();
                resetUndoStack();
                try {
                    let project = currentProject;
                    if (!project || project.id !== projectId) {
                        project = await loadProject(projectId);
                    }

                    if (!project) {
                        navigate('/projects', { replace: true });
                        return;
                    }

                    const record =
                        (project.data as Record<string, unknown>) || {};
                    const diagram: Diagram = {
                        id: project.id,
                        name:
                            (record.name as string) ||
                            (record.title as string) ||
                            project.title ||
                            'Untitled Diagram',
                        databaseType:
                            (record.databaseType as DatabaseType) ||
                            DatabaseType.POSTGRESQL,
                        databaseEdition:
                            record.databaseEdition as Diagram['databaseEdition'],
                        tables: (record.tables as Diagram['tables']) ?? [],
                        relationships:
                            (record.relationships as Diagram['relationships']) ??
                            [],
                        dependencies:
                            (record.dependencies as Diagram['dependencies']) ??
                            [],
                        areas: (record.areas as Diagram['areas']) ?? [],
                        customTypes:
                            (record.customTypes as Diagram['customTypes']) ??
                            [],
                        notes: (record.notes as Diagram['notes']) ?? [],
                        createdAt: record.createdAt
                            ? new Date(
                                  record.createdAt as string | number | Date
                              )
                            : new Date(project.createdAt),
                        updatedAt: record.updatedAt
                            ? new Date(
                                  record.updatedAt as string | number | Date
                              )
                            : new Date(project.updatedAt),
                    };

                    currentDiagramLoadingRef.current = projectId;
                    loadDiagramFromData(diagram);
                    setInitialDiagram(diagram);
                } catch (error) {
                    console.error(
                        'Failed to load cloud project diagram:',
                        error
                    );
                    navigate('/projects', { replace: true });
                } finally {
                    hideLoader();
                }
            };

            loadCloudProjectDiagram();
            return;
        }

        // If no projectId, handle local storage / diagramId flow
        if (!config) {
            return;
        }

        if (currentDiagram?.id === diagramId && diagramId) {
            return;
        }

        const loadDefaultDiagram = async () => {
            if (diagramId) {
                setInitialDiagram(undefined);
                showLoader();
                resetRedoStack();
                resetUndoStack();
                const diagram = await loadDiagram(diagramId);
                if (!diagram) {
                    openOpenDiagramDialog({ canClose: false });
                    hideLoader();
                    return;
                }

                setInitialDiagram(diagram);
                hideLoader();

                return;
            } else if (!diagramId && config.defaultDiagramId) {
                const diagram = await loadDiagram(config.defaultDiagramId);
                if (diagram) {
                    navigate(`/diagrams/${config.defaultDiagramId}`);

                    return;
                }
            }
            const diagrams = await listDiagrams();

            if (diagrams.length > 0) {
                openOpenDiagramDialog({ canClose: false });
            } else {
                openCreateDiagramDialog();
            }
        };

        if (
            currentDiagramLoadingRef.current === (diagramId ?? '') &&
            currentDiagramLoadingRef.current !== undefined
        ) {
            return;
        }
        currentDiagramLoadingRef.current = diagramId ?? '';

        loadDefaultDiagram();
    }, [
        projectId,
        diagramId,
        isAuthenticated,
        isAuthLoading,
        currentProject,
        loadProject,
        loadDiagramFromData,
        openCreateDiagramDialog,
        config,
        navigate,
        listDiagrams,
        loadDiagram,
        resetRedoStack,
        resetUndoStack,
        hideLoader,
        showLoader,
        currentDiagram?.id,
        openOpenDiagramDialog,
    ]);

    return { initialDiagram };
};
