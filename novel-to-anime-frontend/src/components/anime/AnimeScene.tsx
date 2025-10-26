import type { AnimeScene as AnimeSceneType, Dialogue } from '../../types';
import { resolveAssetUrl } from '../../services/api';

interface AnimeSceneProps {
  scene: AnimeSceneType;
  sceneIndex: number;
  onDialogueClick?: (dialogue: Dialogue, dialogueIndex: number) => void;
  playingDialogueIndex?: number;
}

export const AnimeScene = ({ 
  scene, 
  sceneIndex, 
  onDialogueClick,
  playingDialogueIndex 
}: AnimeSceneProps) => {
  const handleDialogueClick = (dialogue: Dialogue, index: number) => {
    if (onDialogueClick) {
      onDialogueClick(dialogue, index);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Scene Image */}
      <div className="relative">
        {scene.imageURL ? (
          <img
            src={resolveAssetUrl(scene.imageURL)}
            alt={`Scene ${sceneIndex + 1}`}
            className="w-full h-64 sm:h-80 md:h-96 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIGZhaWxlZCB0byBsb2FkPC90ZXh0Pjwvc3ZnPg==';
            }}
          />
        ) : (
          <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-200 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">Scene {sceneIndex + 1}</p>
              <p className="text-xs text-gray-400">No image available</p>
            </div>
          </div>
        )}
        
        {/* Scene number overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium">
          Scene {sceneIndex + 1}
        </div>
      </div>

      {/* Scene Content */}
      <div className="p-6">
        {/* Narration */}
        {scene.narration && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Narration
            </h3>
            <p className="text-gray-800 leading-relaxed italic">
              {scene.narration}
            </p>
          </div>
        )}

        {/* Dialogues */}
        {scene.dialogues && scene.dialogues.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Dialogues
            </h3>
            <div className="space-y-3">
              {scene.dialogues.map((dialogue, index) => (
                <div
                  key={index}
                  onClick={() => handleDialogueClick(dialogue, index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    playingDialogueIndex === index
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {playingDialogueIndex === index ? (
                        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {dialogue.character}
                        </span>
                        <span className="text-xs text-gray-500">
                          Click to play
                        </span>
                      </div>
                      <p className="text-gray-700">
                        "{dialogue.line}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};