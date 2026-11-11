import { useEffect, useRef } from 'react';
import { useChartDB } from './use-chartdb';
import { useProject } from './use-project';
import type { Diagram } from '@/lib/domain/diagram';
import { DatabaseType } from '@/lib/domain/database-type';

export const useCloudSync = () => {
    const { loadDiagramFromData, currentDiagram, updateDiagramName } =
        useChartDB();

    const { currentProject, broadcastDiagramChange, registerDiagramHandlers } =
        useProject();

    const isInitialMount = useRef(true);
    const lastBroadcastedRef = useRef<string>('');

    // Register handlers to allow ProjectProvider to read/write the canvas diagram
    useEffect(() => {
        const unregister = registerDiagramHandlers({
            loadDiagram: (data: unknown) => {
                if (!data || typeof data !== 'object') return;
                const record = data as Record<string, unknown>;
                const diagram: Diagram = {
                    id:
                        (record.id as string) ||
                        currentProject?.id ||
                        'cloud-diagram',
                    name:
                        (record.name as string) ||
                        (record.title as string) ||
                        currentProject?.title ||
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
                        (record.dependencies as Diagram['dependencies']) ?? [],
                    areas: (record.areas as Diagram['areas']) ?? [],
                    customTypes:
                        (record.customTypes as Diagram['customTypes']) ?? [],
                    notes: (record.notes as Diagram['notes']) ?? [],
                    createdAt: record.createdAt
                        ? new Date(record.createdAt as string | number | Date)
                        : new Date(),
                    updatedAt: record.updatedAt
                        ? new Date(record.updatedAt as string | number | Date)
                        : new Date(),
                };
                loadDiagramFromData(diagram);
                if (record.name || record.title) {
                    updateDiagramName((record.name || record.title) as string, {
                        updateHistory: false,
                    });
                }
            },
            getCurrentDiagram: () => currentDiagram,
        });

        return unregister;
    }, [
        registerDiagramHandlers,
        loadDiagramFromData,
        currentDiagram,
        currentProject,
        updateDiagramName,
    ]);

    // Broadcast local changes to room
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (!currentProject) {
            return;
        }

        // Quick hash/json check to avoid redundant emissions
        try {
            const serialized = JSON.stringify({
                tables: currentDiagram.tables,
                relationships: currentDiagram.relationships,
                areas: currentDiagram.areas,
                notes: currentDiagram.notes,
            });

            if (serialized === lastBroadcastedRef.current) {
                return;
            }

            lastBroadcastedRef.current = serialized;
            broadcastDiagramChange(currentDiagram);
        } catch (e) {
            console.error('Error broadcasting diagram changes', e);
        }
    }, [currentDiagram, currentProject, broadcastDiagramChange]);
};
