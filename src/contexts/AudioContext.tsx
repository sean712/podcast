import { createContext, useContext, useState, ReactNode } from 'react';

interface AudioContextType {
  currentEpisode: {
    episodeId: string;
    title: string;
    audioUrl: string;
    imageUrl?: string;
    podcastName?: string;
  } | null;
  isPlaying: boolean;
  currentTime: number;
  seekToTime: number | null;
  setCurrentEpisode: (episode: {
    episodeId: string;
    title: string;
    audioUrl: string;
    imageUrl?: string;
    podcastName?: string;
  } | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  seekTo: (time: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<AudioContextType['currentEpisode']>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  const seekTo = (time: number) => {
    setSeekToTime(null);
    setTimeout(() => {
      setSeekToTime(time);
      setCurrentTime(time);
    }, 0);
  };

  return (
    <AudioContext.Provider
      value={{
        currentEpisode,
        isPlaying,
        currentTime,
        seekToTime,
        setCurrentEpisode,
        setIsPlaying,
        setCurrentTime,
        seekTo,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
