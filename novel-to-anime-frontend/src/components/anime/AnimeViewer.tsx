import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { useAnime } from '../../hooks/useAnime';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useTasks } from '../../hooks/useTasks';
import { storage } from '../../utils';
import type { Dialogue } from '../../types';

interface AnimeViewerProps {
  taskId: string;
}

export const AnimeViewer = ({ taskId }: AnimeViewerProps) => {
  const navigate = useNavigate();
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(() => {
    // Load auto-play preference from localStorage
    return storage.getItem('autoPlayEnabled', true);
  });
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const { 
    animeData, 
    currentScene, 
    isLoading, 
    error, 
    loadAnimeData, 
    getCurrentScene,
    nextScene,
    previousScene
  } = useAnime();
  
  const { toggleDialogue, playNarration, startAutoPlay, isDialoguePlaying } = useAudioPlayer();
  const { currentTask } = useTasks();

  // Load anime data when component mounts or taskId changes
  useEffect(() => {
    if (taskId && currentTask?.status === 'done') {
      loadAnimeData(taskId).then(() => {
        setHasInitialized(true);
      });
    }
  }, [taskId, currentTask?.status, loadAnimeData]);

  // Save auto-play preference when it changes
  useEffect(() => {
    storage.setItem('autoPlayEnabled', autoPlayEnabled);
  }, [autoPlayEnabled]);

  // Auto-play when scene changes or project opens
  useEffect(() => {
    if (!autoPlayEnabled || !animeData || !hasInitialized) return;
    
    const scene = getCurrentScene();
    console.log('Scene changed:', { 
      currentScene, 
      scene,
      hasDialogues: scene?.dialogues ? scene.dialogues.length : 0,
      hasNarration: !!scene?.narrationVoiceURL,
      autoPlayEnabled
    });
    
    if (scene) {
      // Use auto-play queue to play narration and dialogues in sequence
      const hasNarration = scene.narrationVoiceURL;
      const hasDialogues = scene.dialogues && scene.dialogues.length > 0;
      
      if (hasNarration || hasDialogues) {
        console.log('Starting auto-play for scene:', currentScene);
        
        // Use a longer delay and clear any existing timeouts to prevent race conditions
        const timeoutId = setTimeout(() => {
          startAutoPlay(
            scene.dialogues || [], 
            currentScene, 
            hasNarration ? { url: scene.narrationVoiceURL! } : undefined
          );
        }, 1000); // Longer delay to ensure everything is ready
        
        // Cleanup function to clear timeout if effect runs again
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
  }, [currentScene, autoPlayEnabled, animeData?.scenes?.length, hasInitialized]); // More specific dependencies

  const handleDialogueClick = async (dialogue: Dialogue, dialogueIndex: number) => {
    try {
      // Manual click stops auto-play for this scene
      await toggleDialogue(dialogue.voiceURL, currentScene, dialogueIndex);
    } catch (error) {
      console.error('Failed to play dialogue:', error);
    }
  };

  const handleNarrationClick = async () => {
    const scene = getCurrentScene();
    if (scene?.narrationVoiceURL) {
      try {
        // Manual click stops auto-play for this scene
        await playNarration(scene.narrationVoiceURL, currentScene);
      } catch (error) {
        console.error('Failed to play narration:', error);
      }
    }
  };

  const getCurrentPlayingDialogue = () => {
    const scene = getCurrentScene();
    if (!scene) return -1;
    
    return scene.dialogues.findIndex((_, index) => 
      isDialoguePlaying(currentScene, index)
    );
  };

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
            Loading anime content...
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Please wait while we prepare your story
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          border: '1px solid #e5e7eb',
          maxWidth: '400px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg style={{ width: '24px', height: '24px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
            Failed to load anime content
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
            {error}
          </p>
          <Button onClick={() => loadAnimeData(taskId)} size="sm" variant="secondary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!animeData || !animeData.scenes || animeData.scenes.length === 0) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#f3f4f6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg style={{ width: '24px', height: '24px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0V1" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
            No anime content available
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            The conversion task may not be complete yet.
          </p>
        </div>
      </div>
    );
  }

  const scene = getCurrentScene();
  if (!scene) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>Scene not found</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
      {/* Top Navigation Bar */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>返回首页</span>
          </button>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0V1" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                {currentTask?.name || '星光照和家的味道'}
              </h2>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                第 {currentScene + 1} 章 / 共 {animeData.scenes.length} 章
                {scene.dialogues && scene.dialogues.length > 0 && (
                  <span style={{ 
                    marginLeft: '8px', 
                    padding: '2px 6px', 
                    backgroundColor: '#10b981', 
                    color: 'white', 
                    borderRadius: '4px', 
                    fontSize: '12px' 
                  }}>
                    有对话
                  </span>
                )}
                {autoPlayEnabled && (
                  <span style={{ 
                    marginLeft: '8px', 
                    padding: '2px 6px', 
                    backgroundColor: '#3b82f6', 
                    color: 'white', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <svg style={{ width: '10px', height: '10px' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    自动播放
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Navigation buttons */}
          <button 
            style={{
              padding: '8px',
              color: currentScene === 0 ? '#d1d5db' : '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: currentScene === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            disabled={currentScene === 0}
            onClick={() => {
              console.log('Previous scene clicked, current scene:', currentScene);
              previousScene();
            }}
            title="上一章"
            onMouseEnter={(e) => {
              if (currentScene !== 0) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = currentScene === 0 ? '#d1d5db' : '#6b7280';
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            style={{
              padding: '8px',
              color: currentScene === animeData.scenes.length - 1 ? '#d1d5db' : '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: currentScene === animeData.scenes.length - 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            disabled={currentScene === animeData.scenes.length - 1}
            onClick={() => {
              console.log('Next scene clicked, current scene:', currentScene);
              nextScene();
            }}
            title="下一章"
            onMouseEnter={(e) => {
              if (currentScene !== animeData.scenes.length - 1) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = currentScene === animeData.scenes.length - 1 ? '#d1d5db' : '#6b7280';
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }}></div>
          


          
          {/* Auto-play toggle */}
          <button 
            style={{
              padding: '8px 12px',
              color: autoPlayEnabled ? 'white' : '#6b7280',
              backgroundColor: autoPlayEnabled ? '#10b981' : 'transparent',
              border: autoPlayEnabled ? 'none' : '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={autoPlayEnabled ? "关闭自动播放" : "开启自动播放"}
            onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
            onMouseEnter={(e) => {
              if (!autoPlayEnabled) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (!autoPlayEnabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>{autoPlayEnabled ? '自动播放' : '手动播放'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        padding: '24px', 
        overflow: 'hidden'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          height: '100%'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            height: '100%',
            display: 'flex',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}>
            {/* Left Panel - Image */}
            <div style={{ 
              flex: 1, 
              position: 'relative',
              backgroundColor: '#f8f9fa',
              borderRight: '1px solid #e5e7eb'
            }}>
              {scene.imageURL ? (
                <img
                  src={scene.imageURL}
                  alt={`Scene ${currentScene + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIGZhaWxlZCB0byBsb2FkPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <svg style={{ 
                      width: '64px', 
                      height: '64px', 
                      color: '#d1d5db',
                      margin: '0 auto 16px'
                    }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p style={{ fontSize: '18px', color: '#9ca3af', margin: '0 0 8px 0' }}>Scene {currentScene + 1}</p>
                    <p style={{ fontSize: '14px', color: '#d1d5db', margin: 0 }}>No image available</p>
                  </div>
                </div>
              )}
              

            </div>

            {/* Right Panel - Text Content */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column'
            }}>
              <div style={{ 
                flex: 1, 
                padding: '48px', 
                overflowY: 'auto'
              }}>
                {/* Narration */}
                {scene.narration && (
                  <div style={{ marginBottom: '48px' }}>
                    <p 
                      style={{
                        fontSize: '18px',
                        lineHeight: '1.8',
                        color: '#1f2937',
                        cursor: 'pointer',
                        padding: '16px',
                        borderRadius: '12px',
                        transition: 'background-color 0.2s ease',
                        fontFamily: '"Noto Serif SC", "Times New Roman", serif',
                        textAlign: 'justify',
                        letterSpacing: '0.05em'
                      }}
                      onClick={() => handleNarrationClick()}
                      title="点击播放旁白"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {scene.narration}
                    </p>
                  </div>
                )}

                {/* Dialogues */}
                {scene.dialogues && scene.dialogues.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {scene.dialogues.map((dialogue, index) => {
                      const isCurrentlyPlaying = getCurrentPlayingDialogue() === index;
                      return (
                        <div
                          key={index}
                          onClick={() => handleDialogueClick(dialogue, index)}
                          style={{
                            padding: '20px',
                            cursor: 'pointer',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                            backgroundColor: isCurrentlyPlaying ? '#eff6ff' : 'transparent',
                            border: isCurrentlyPlaying ? '2px solid #3b82f6' : '2px solid transparent',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrentlyPlaying) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrentlyPlaying) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{ flexShrink: 0, marginTop: '4px' }}>
                              {isCurrentlyPlaying ? (
                                <svg style={{ width: '20px', height: '20px', color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg style={{ width: '20px', height: '20px', color: '#9ca3af' }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#4b5563',
                                marginBottom: '8px',
                                letterSpacing: '0.025em'
                              }}>
                                {dialogue.character}
                              </div>
                              <p style={{
                                fontSize: '16px',
                                lineHeight: '1.7',
                                color: '#1f2937',
                                margin: 0,
                                fontFamily: '"Noto Sans SC", sans-serif'
                              }}>
                                "{dialogue.line}"
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    color: '#9ca3af'
                  }}>
                    <svg style={{ 
                      width: '48px', 
                      height: '48px', 
                      margin: '0 auto 16px',
                      color: '#d1d5db'
                    }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p style={{ fontSize: '16px', margin: 0 }}>
                      此场景暂无对话
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom page indicator */}
              <div style={{
                padding: '24px',
                borderTop: '1px solid #f3f4f6',
                textAlign: 'center'
              }}>
                <span style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontFamily: 'Georgia, serif'
                }}>
                  第 {currentScene + 1} 章
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};