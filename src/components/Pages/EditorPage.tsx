/**
 * Editor Page
 *
 * Container page for the token editor interface including all sub-tabs
 * (Editor, Gallery, Customize, Script, Export).
 */

import { useState, useCallback } from 'react'
import { TabNavigation } from '../Layout/TabNavigation'
import type { TabType } from '../Layout/TabNavigation'
import { ProjectManagerPage } from './ProjectManagerPage'
import { EditorView } from '../Views/EditorView'
import { GalleryView } from '../Views/GalleryView'
import { CustomizeView } from '../Views/CustomizeView'
import { ScriptView } from '../Views/ScriptView'
import { StudioView } from '../Studio/StudioView'
import { DownloadView } from '../Views/DownloadView'
import { TownSquareView } from '../Views/TownSquareView'
import { useProjects } from '../../hooks/useProjects'
import { useToast } from '../../contexts/ToastContext'
import { useTokenContext } from '../../contexts/TokenContext'
import type { Token } from '../../ts/types/index.js'
import styles from '../../styles/components/pages/Pages.module.css'

export function EditorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('projects')
  const [selectedTokenForCustomize, setSelectedTokenForCustomize] = useState<Token | undefined>(undefined)
  const [createNewCharacter, setCreateNewCharacter] = useState(false)
  // Remember the last selected character UUID when navigating away from Characters tab
  const [lastSelectedCharacterUuid, setLastSelectedCharacterUuid] = useState<string | undefined>(undefined)
  const { createProject, activateProject, currentProject } = useProjects()
  const { addToast } = useToast()
  const { tokens, characters } = useTokenContext()

  const handleTokenClick = useCallback((token: Token) => {
    setSelectedTokenForCustomize(token)
    setCreateNewCharacter(false)
    // Clear last selected character when explicitly clicking a token (explicit navigation)
    setLastSelectedCharacterUuid(undefined)
    setActiveTab('customize')
  }, [])

  const handleTabChange = useCallback((tab: TabType) => {
    // Reset createNewCharacter when manually changing tabs
    if (tab !== 'customize') {
      setCreateNewCharacter(false)
    }
    // When switching back to customize tab, clear selectedTokenForCustomize
    // so it uses lastSelectedCharacterUuid instead (if available)
    if (tab === 'customize') {
      setSelectedTokenForCustomize(undefined)
      setCreateNewCharacter(false)
    }
    setActiveTab(tab)
  }, [])

  const handleNavigateToCustomize = useCallback(() => {
    setSelectedTokenForCustomize(undefined)
    setCreateNewCharacter(true)
    setActiveTab('customize')
  }, [])

  const handleNavigateToProjects = useCallback(() => {
    setActiveTab('projects')
  }, [])

  // Handle "Edit Character" from night order context menu
  const handleEditCharacter = useCallback((characterId: string) => {
    // Find the character by ID
    const character = characters.find(c => c.id === characterId)
    if (!character) {
      console.warn(`Character not found: ${characterId}`)
      return
    }

    // Find the matching token by character name (character tokens have type 'character')
    const token = tokens.find(t =>
      t.type === 'character' &&
      t.name.toLowerCase() === character.name.toLowerCase()
    )

    if (token) {
      // Use existing handleTokenClick pattern
      setSelectedTokenForCustomize(token)
      setCreateNewCharacter(false)
      // Clear last selected character when explicitly navigating to a character
      setLastSelectedCharacterUuid(undefined)
      setActiveTab('customize')
    } else {
      console.warn(`Token not found for character: ${character.name}`)
    }
  }, [characters, tokens])

  // Handle character selection changes from CustomizeView
  const handleCharacterSelect = useCallback((characterUuid: string) => {
    setLastSelectedCharacterUuid(characterUuid)
  }, [])

  const handleCreateProject = useCallback(async () => {
    try {
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
      const newProject = await createProject(`New Project - ${timestamp}`)
      if (newProject) {
        await activateProject(newProject.id)
      }
      addToast('New project created and activated!', 'success')
      setActiveTab('projects')
    } catch (err) {
      console.error('Failed to create project:', err)
      addToast('Failed to create project', 'error')
    }
  }, [createProject, activateProject, addToast])

  const renderActiveView = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectManagerPage initialProjectId={currentProject?.id} />
      case 'editor':
        return (
          <EditorView 
            onNavigateToCustomize={handleNavigateToCustomize}
            onNavigateToProjects={handleNavigateToProjects}
            onCreateProject={handleCreateProject}
          />
        )
      case 'gallery':
        return <GalleryView onTokenClick={handleTokenClick} onTabChange={handleTabChange} />
      case 'customize':
        return (
          <CustomizeView
            key="customize-view"
            initialToken={selectedTokenForCustomize}
            selectedCharacterUuid={lastSelectedCharacterUuid}
            onCharacterSelect={handleCharacterSelect}
            onGoToGallery={() => setActiveTab('gallery')}
            createNewCharacter={createNewCharacter}
          />
        )
      case 'script':
        return <ScriptView onEditCharacter={handleEditCharacter} />
      case 'studio':
        return <StudioView />
      case 'download':
        return <DownloadView />
      case 'town-square':
        return <TownSquareView />
      default:
        return <ProjectManagerPage />
    }
  }

  return (
    <div className={styles.pageContainer}>
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        lastSelectedCharacterUuid={lastSelectedCharacterUuid}
      />
      <div className={styles.pageContent}>
        {renderActiveView()}
      </div>
    </div>
  )
}
