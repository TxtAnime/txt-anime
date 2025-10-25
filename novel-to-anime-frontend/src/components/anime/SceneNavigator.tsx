import { useAnime } from '../../hooks/useAnime';
import { Button } from '../common/Button';

interface SceneNavigatorProps {
  showThumbnails?: boolean;
  className?: string;
}

export const SceneNavigator = ({ showThumbnails = false, className = '' }: SceneNavigatorProps) => {
  const { 
    animeData, 
    currentScene, 
    totalScenes, 
    hasNextScene, 
    hasPreviousScene,
    goToScene,
    nextScene,
    previousScene 
  } = useAnime();

  if (!animeData || totalScenes === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={previousScene}
          disabled={!hasPreviousScene}
          variant="secondary"
          size="sm"
        >
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {currentScene + 1} / {totalScenes}
          </div>
          <div className="text-xs text-gray-500">
            Scene
          </div>
        </div>

        <Button
          onClick={nextScene}
          disabled={!hasNextScene}
          variant="secondary"
          size="sm"
        >
          Next
          <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentScene + 1) / totalScenes) * 100}%` }}
          />
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <Button
          onClick={() => goToScene(0)}
          disabled={currentScene === 0}
          variant="ghost"
          size="sm"
        >
          First
        </Button>
        <Button
          onClick={() => goToScene(totalScenes - 1)}
          disabled={currentScene === totalScenes - 1}
          variant="ghost"
          size="sm"
        >
          Last
        </Button>
      </div>

      {/* Thumbnail Grid */}
      {showThumbnails && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Scene Overview</h3>
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {animeData.scenes.map((scene, index) => (
              <button
                key={index}
                onClick={() => goToScene(index)}
                className={`relative aspect-video rounded border-2 overflow-hidden transition-all duration-200 ${
                  index === currentScene
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={scene.imageURL}
                  alt={`Scene ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iOCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPnt7aW5kZXggKyAxfX08L3RleHQ+PC9zdmc+';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200" />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center space-x-4">
            <span>← → Navigate</span>
            <span>Home/End Jump</span>
          </div>
        </div>
      </div>
    </div>
  );
};