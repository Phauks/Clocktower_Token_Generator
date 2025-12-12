/**
 * Projects Management Hook
 *
 * Provides project CRUD operations and state management for UI components.
 * Refactored to use handleAsyncOperation and logger utilities.
 *
 * @module hooks/useProjects
 */

import { useState, useEffect, useCallback } from 'react';
import { useProjectContext } from '../contexts/ProjectContext';
import { useTokenContext } from '../contexts/TokenContext';
import { projectService } from '../ts/services/project';
import { handleAsyncOperation, logger } from '../ts/utils/index.js';
import type { Project, CreateProjectOptions, ListProjectsOptions } from '../ts/types/project.js';

export function useProjects() {
  const { currentProject, setCurrentProject, projects, setProjects } = useProjectContext();
  const {
    characters,
    scriptMeta,
    generationOptions,
    jsonInput,
    filters,
    characterMetadata,
    setCharacters,
    setScriptMeta,
    setJsonInput,
    setTokens,
    updateGenerationOptions,
    setMetadata,
    clearAllMetadata,
  } = useTokenContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all projects
   */
  const loadProjects = useCallback(async (options?: ListProjectsOptions) => {
    await handleAsyncOperation(
      () => projectService.listProjects(options),
      'Load projects',
      setIsLoading,
      setError,
      {
        successMessage: 'Projects loaded successfully',
        onSuccess: (loadedProjects) => {
          setProjects(loadedProjects as Project[]);
        }
      }
    );
  }, [setProjects]);

  /**
   * Create a new project from current state
   */
  const createProject = useCallback(
    async (name: string, description?: string) => {
      const options: CreateProjectOptions = {
        name,
        description,
        state: {
          jsonInput,
          characters,
          scriptMeta,
          characterMetadata: Object.fromEntries(characterMetadata),
          generationOptions: { ...generationOptions },
          customIcons: [],
          filters,
          schemaVersion: 1,
        },
      };

      const project = await handleAsyncOperation(
        () => projectService.createProject(options),
        'Create project',
        setIsLoading,
        setError,
        {
          successMessage: `Project "${name}" created successfully`,
          onSuccess: (createdProject) => {
            setCurrentProject(createdProject as Project);
            // Refresh project list
            loadProjects().catch(err =>
              logger.warn('Create project', 'Failed to refresh project list', err)
            );
          }
        }
      );

      return project as Project | undefined;
    },
    [
      jsonInput,
      characters,
      scriptMeta,
      characterMetadata,
      generationOptions,
      filters,
      setCurrentProject,
      loadProjects,
    ]
  );

  /**
   * Delete a project
   */
  const deleteProject = useCallback(
    async (projectId: string) => {
      await handleAsyncOperation(
        () => projectService.deleteProject(projectId),
        'Delete project',
        setIsLoading,
        setError,
        {
          successMessage: 'Project deleted successfully',
          onSuccess: () => {
            // If deleted project was current, clear it
            if (currentProject?.id === projectId) {
              setCurrentProject(null);
              logger.info('Delete project', 'Current project cleared');
            }
            // Refresh project list
            loadProjects().catch(err =>
              logger.warn('Delete project', 'Failed to refresh project list', err)
            );
          }
        }
      );
    },
    [currentProject, setCurrentProject, loadProjects]
  );

  /**
   * Load a project (without activating it)
   */
  const loadProject = useCallback(
    async (projectId: string) => {
      const project = await handleAsyncOperation(
        async () => {
          const proj = await projectService.getProject(projectId);
          if (!proj) {
            throw new Error('Project not found');
          }
          return proj;
        },
        'Load project',
        setIsLoading,
        setError,
        {
          successMessage: 'Project loaded successfully',
          onSuccess: (loadedProject) => {
            setCurrentProject(loadedProject as Project);
          }
        }
      );

      return project as Project | undefined;
    },
    [setCurrentProject]
  );

  /**
   * Activate a project (load it and apply its state to TokenContext)
   * Pass empty string to deactivate the current project
   */
  const activateProject = useCallback(
    async (projectId: string) => {
      // Handle deactivation case
      if (!projectId) {
        setCurrentProject(null);
        // Clear all associated data to prevent stale information
        setJsonInput('');
        setCharacters([]);
        setTokens([]);
        setScriptMeta(null);
        clearAllMetadata();
        logger.info('Activate project', 'Project deactivated');
        return null;
      }

      const project = await handleAsyncOperation(
        async () => {
          const proj = await projectService.getProject(projectId);
          if (!proj) {
            throw new Error('Project not found');
          }
          return proj;
        },
        'Activate project',
        setIsLoading,
        setError,
        {
          successMessage: 'Project activated successfully',
          onSuccess: (loadedProject) => {
            const proj = loadedProject as Project;

            // Set as current project
            setCurrentProject(proj);

            // Apply project state to TokenContext
            setJsonInput(proj.state.jsonInput);
            setCharacters(proj.state.characters);
            setScriptMeta(proj.state.scriptMeta);

            // Apply generation options
            updateGenerationOptions(proj.state.generationOptions);

            // Apply character metadata
            clearAllMetadata();
            if (proj.state.characterMetadata) {
              Object.entries(proj.state.characterMetadata).forEach(([uuid, metadata]) => {
                setMetadata(uuid, metadata);
              });
            }

            logger.debug('Activate project', 'Project state restored', {
              characterCount: proj.state.characters.length,
              hasScriptMeta: !!proj.state.scriptMeta
            });
          }
        }
      );

      return project as Project | undefined | null;
    },
    [
      setCurrentProject,
      setJsonInput,
      setCharacters,
      setTokens,
      setScriptMeta,
      updateGenerationOptions,
      clearAllMetadata,
      setMetadata,
    ]
  );

  /**
   * Export a project
   */
  const exportProject = useCallback(async (projectId: string) => {
    await handleAsyncOperation(
      () => projectService.exportAndDownload(projectId),
      'Export project',
      setIsLoading,
      setError,
      {
        successMessage: 'Project exported successfully'
      }
    );
  }, []);

  /**
   * Import a project
   */
  const importProject = useCallback(
    async (file: File) => {
      const project = await handleAsyncOperation(
        () => projectService.importProject(file),
        'Import project',
        setIsLoading,
        setError,
        {
          successMessage: 'Project imported successfully',
          onSuccess: () => {
            // Refresh project list
            loadProjects().catch(err =>
              logger.warn('Import project', 'Failed to refresh project list', err)
            );
          }
        }
      );

      return project as Project | undefined;
    },
    [loadProjects]
  );

  /**
   * Duplicate a project
   */
  const duplicateProject = useCallback(
    async (projectId: string) => {
      const project = await handleAsyncOperation(
        async () => {
          // Get the source project
          const sourceProject = await projectService.getProject(projectId);
          if (!sourceProject) {
            throw new Error('Project not found');
          }

          // Create a new project with copied state
          const options: CreateProjectOptions = {
            name: `${sourceProject.name} (Copy)`,
            description: sourceProject.description,
            state: {
              ...sourceProject.state,
            },
          };

          return await projectService.createProject(options);
        },
        'Duplicate project',
        setIsLoading,
        setError,
        {
          successMessage: 'Project duplicated successfully',
          onSuccess: () => {
            // Refresh project list
            loadProjects().catch(err =>
              logger.warn('Duplicate project', 'Failed to refresh project list', err)
            );
          }
        }
      );

      return project as Project | undefined;
    },
    [loadProjects]
  );

  /**
   * Update project metadata
   */
  const updateProject = useCallback(
    async (projectId: string, updates: Partial<Project>) => {
      const project = await handleAsyncOperation(
        () => projectService.updateProject(projectId, updates),
        'Update project',
        setIsLoading,
        setError,
        {
          successMessage: 'Project updated successfully',
          onSuccess: (updatedProject) => {
            // Update current project if it's the one being updated
            if (currentProject?.id === projectId) {
              setCurrentProject(updatedProject as Project);
            }
            // Refresh project list
            loadProjects().catch(err =>
              logger.warn('Update project', 'Failed to refresh project list', err)
            );
          }
        }
      );

      return project as Project | undefined;
    },
    [currentProject, setCurrentProject, loadProjects]
  );

  // Load projects on mount
  useEffect(() => {
    logger.info('useProjects', 'Hook mounted, loading projects');
    loadProjects().catch(err =>
      logger.error('useProjects', 'Failed to load projects on mount', err)
    );
  }, [loadProjects]);

  return {
    // State
    projects,
    currentProject,
    isLoading,
    error,

    // Actions
    createProject,
    loadProject,
    activateProject,
    updateProject,
    deleteProject,
    duplicateProject,
    exportProject,
    importProject,
    loadProjects,
  };
}
