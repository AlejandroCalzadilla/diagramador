import { useContext } from 'react';
import { projectContext } from '@/context/project-context/project-context';

export const useProject = () => useContext(projectContext);
