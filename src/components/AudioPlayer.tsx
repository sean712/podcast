import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { savePlaybackProgress, getPlaybackProgress } from '../services/playbackProgressService';
import { useAuth } from '../contexts/AuthContext';

interface AudioPlayerProps {
  audioUrl: string;
  episodeTitle: string;
  episodeId?: string;
  podcastName?: string;
  episodeImage?: string;
  onTimeUpdate?: (currentTime: number) => void;
  initialTime?: number;
  compact?: boolean;
}

export default function AudioPlayer({
  audioUrl,
  episodeTitle,
  episodeId,
  podcastName,
  episodeImage,
  onTimeUpdate,
  initialTime = 0,
  compact = false,
}: AudioPlayerProps) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const saveProgressTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    async function loadSavedProgress() {
      if (!user || !episodeId) return;

      try {
        const progress = await getPlaybackProgress(episodeId);
        if (progress && progress.current_position > 0 && audioRef.current) {
          audioRef.current.currentTime = progress.current_position;
          setCurrentTime(progress.current_position);
        }
      } catch (err) {
        console.error('Error loading saved progress:', err);
      }
    }

    loadSavedProgress();
  }, [user, episodeId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      if (initialTime > 0 && !user) {
        audio.currentTime = initialTime;
        setCurrentTime(initialTime);
      }
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      if (user && episodeId && podcastName) {
        if (saveProgressTimeoutRef.current) {
          clearTimeout(saveProgressTimeoutRef.current);
        }

        saveProgressTimeoutRef.current = window.setTimeout(() => {
          savePlaybackProgress(
            episodeId,
            episodeTitle,
            podcastName,
            audioUrl,
            time,
            audio.duration
          ).catch(err => console.error('Error saving progress:', err));
        }, 2000);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    const handleError = () => {
      setError('Failed to load audio. Please try again.');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [initialTime, onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Error playing audio:', err);
        setError('Failed to play audio. Please try again.');
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        <button
          onClick={togglePlayPause}
          disabled={isLoading || !!error}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 whitespace-nowrap">
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-400">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden cursor-pointer group relative">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={isLoading || !!error}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div
              className="h-full bg-blue-600 transition-all relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {[0.5, 1, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors ${
                  playbackRate === rate
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <button
            onClick={() => skip(-15)}
            disabled={isLoading || !!error}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Skip back 15 seconds"
            title="Skip back 15s"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => skip(15)}
            disabled={isLoading || !!error}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Skip forward 15 seconds"
            title="Skip forward 15s"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          {episodeImage && (
            <img
              src={episodeImage}
              alt={episodeTitle}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate mb-1">
              Now Playing
            </h3>
            <p className="text-sm text-slate-600 truncate">{episodeTitle}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={isLoading || !!error}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${progressPercentage}%, #e2e8f0 ${progressPercentage}%, #e2e8f0 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-slate-600">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => skip(-15)}
              disabled={isLoading || !!error}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Skip back 15 seconds"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlayPause}
              disabled={isLoading || !!error}
              className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skip(15)}
              disabled={isLoading || !!error}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Skip forward 15 seconds"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-600 [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-slate-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Speed:</span>
              <div className="flex gap-1">
                {[0.5, 1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      playbackRate === rate
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
