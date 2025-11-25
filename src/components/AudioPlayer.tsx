import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { savePlaybackProgress, getPlaybackProgress } from '../services/playbackProgressService';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';

interface AudioPlayerProps {
  audioUrl: string;
  episodeTitle: string;
  episodeId?: string;
  podcastName?: string;
  episodeImage?: string;
  onTimeUpdate?: (currentTime: number) => void;
  initialTime?: number;
  compact?: boolean;
  seekToTime?: number;
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
  seekToTime,
}: AudioPlayerProps) {
  const { user } = useAuth();
  const { seekToTime: contextSeekToTime, setIsPlaying: setContextIsPlaying, setCurrentTime: setContextCurrentTime } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && seekToTime !== undefined && !isNaN(seekToTime)) {
      audio.currentTime = seekToTime;
      setCurrentTime(seekToTime);
      if (!isPlaying) {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Error playing audio after seek:', err);
        });
      }
    }
  }, [seekToTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && contextSeekToTime !== null && !isNaN(contextSeekToTime)) {
      console.log('AudioPlayer: Seeking to time from context:', contextSeekToTime);
      audio.currentTime = contextSeekToTime;
      setCurrentTime(contextSeekToTime);
      setContextCurrentTime(contextSeekToTime);

      audio.play().then(() => {
        console.log('AudioPlayer: Playing after seek');
        setIsPlaying(true);
        setContextIsPlaying(true);
      }).catch(err => {
        console.error('Error playing audio after context seek:', err);
      });
    }
  }, [contextSeekToTime]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setContextIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
        setContextIsPlaying(true);
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
          className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
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

          <div className="flex-1 h-1.5 bg-slate-700/40 rounded-full overflow-hidden cursor-pointer group relative">
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
              className="h-full bg-cyan-400 transition-all relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 text-xs font-medium rounded text-slate-200 hover:bg-slate-800/60 transition-colors border border-slate-600"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 py-1 min-w-[60px]">
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs font-medium text-left transition-colors ${
                      playbackRate === rate
                        ? 'bg-cyan-500/10 text-cyan-300'
                        : 'text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
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
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {error && (
        <div className="px-6 py-3 bg-red-900/20 border-b border-red-700/40 text-red-200 text-sm">
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
            <h3 className="font-semibold text-white truncate mb-1">
              Now Playing
            </h3>
            <p className="text-sm text-slate-300 truncate">{episodeTitle}</p>
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
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${progressPercentage}%, #1f2937 ${progressPercentage}%, #1f2937 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-slate-300">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => skip(-15)}
              disabled={isLoading || !!error}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Skip back 15 seconds"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlayPause}
              disabled={isLoading || !!error}
              className="p-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Skip forward 15 seconds"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
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
                className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-300 [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-slate-300 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-3 py-1.5 text-xs font-medium rounded text-slate-200 hover:bg-slate-800 transition-colors border border-slate-600"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 py-1 min-w-[70px]">
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-xs font-medium text-left transition-colors ${
                        playbackRate === rate
                          ? 'bg-cyan-500/10 text-cyan-300'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
