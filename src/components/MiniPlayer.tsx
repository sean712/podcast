import { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Maximize2 } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

interface MiniPlayerProps {
  onExpand?: () => void;
}

export default function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const { currentEpisode, isPlaying, setIsPlaying, currentTime, setCurrentTime, seekTo } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSeekTime, setLastSeekTime] = useState<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      if (currentTime > 0) {
        audio.currentTime = currentTime;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTime, setCurrentTime, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    if (isPlaying) {
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentEpisode, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentTime !== lastSeekTime && Math.abs(audio.currentTime - currentTime) > 1) {
      audio.currentTime = currentTime;
      setLastSeekTime(currentTime);
      if (!isPlaying) {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Error playing audio after seek:', err);
        });
      }
    }
  }, [currentTime]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentEpisode) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl">
      <audio
        ref={audioRef}
        src={currentEpisode.audioUrl}
        preload="metadata"
      />

      <div className="relative">
        <div
          className="absolute top-0 left-0 h-1 bg-blue-600 transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {currentEpisode.imageUrl && (
            <img
              src={currentEpisode.imageUrl}
              alt={currentEpisode.title}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 truncate text-sm">
              {currentEpisode.title}
            </h4>
            {currentEpisode.podcastName && (
              <p className="text-xs text-slate-600 truncate">
                {currentEpisode.podcastName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 flex-shrink-0">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {onExpand && (
            <button
              onClick={onExpand}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Expand player"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
