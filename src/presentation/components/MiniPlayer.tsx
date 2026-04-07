import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, Play, Pause } from 'lucide-react';

interface MiniPlayerProps {
  streamUrl: string;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ streamUrl }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const attemptAutoplay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('Autoplay bloqueado pela política do navegador. Para telas de espera (Kiosk), inicie o browser com a flag apropriada.', error);
        setIsPlaying(false);
      }
    };

    attemptAutoplay();

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [streamUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Falha ao iniciar reprodução:', error);
      }
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Erro ao tentar alternar tela cheia:', err);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 34, 68, 0.85)', // TJRN Blue with opacity
      padding: '10px 20px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      color: '#D4AF37', // Gold text
      boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
      fontFamily: 'sans-serif',
      border: '1px solid rgba(212, 175, 55, 0.3)' // Subtle gold border
    },
    button: {
      background: 'none',
      border: 'none',
      color: '#D4AF37', // Gold icons
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.2s'
    },
    slider: {
      width: '80px',
      cursor: 'pointer',
      accentColor: '#D4AF37' // Gold slider
    },
    label: {
      fontSize: '14px',
      fontWeight: 'bold',
      marginRight: '10px',
      color: '#fff' // White text for the label to contrast with gold icons
    }
  };

  return (
    <div style={styles.container}>
      <span style={styles.label}>📻 Rádio Justiça RN</span>
      <audio ref={audioRef} src={streamUrl} preload="auto" />
      <button style={styles.button} onClick={togglePlay} aria-label={isPlaying ? 'Pausar' : 'Tocar'}>
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        style={styles.slider}
        aria-label="Volume"
      />
      <button style={styles.button} onClick={toggleFullscreen} aria-label={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}>
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
    </div>
  );
};
