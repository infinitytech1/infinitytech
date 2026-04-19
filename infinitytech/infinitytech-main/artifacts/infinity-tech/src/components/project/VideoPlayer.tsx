import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  className?: string;
  title?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function injectOptimizations(url: string): string {
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("f_auto") || url.includes("q_auto")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}

export function VideoPlayer({ src, poster, autoplay = false, className = "", title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLInputElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(autoplay);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const optimizedSrc = injectOptimizations(src);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVisible) return;

    if (autoplay) {
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [isVisible, autoplay]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setProgress(video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    setDuration(videoRef.current?.duration ?? 0);
    setIsLoaded(true);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;
    const val = Number(e.target.value);
    video.currentTime = (val / 100) * video.duration;
    setProgress(val);
  }, [isLoaded]);

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen?.();
    }
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  }, [isPlaying]);

  useEffect(() => {
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl bg-[#080c10] border border-border group select-none ${className}`}
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetControlsTimer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
    >
      {isVisible ? (
        <video
          ref={videoRef}
          src={optimizedSrc}
          poster={poster}
          preload="metadata"
          playsInline
          muted={isMuted}
          className="absolute inset-0 w-full h-full object-contain"
          onPlay={() => { setIsPlaying(true); resetControlsTimer(); }}
          onPause={() => { setIsPlaying(false); setShowControls(true); }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onEnded={() => { setIsPlaying(false); setShowControls(true); setProgress(0); setCurrentTime(0); }}
        />
      ) : (
        poster ? (
          <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0d1117] to-[#070a0e]">
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center">
              <Play className="w-7 h-7 text-primary/50 translate-x-0.5" />
            </div>
          </div>
        )
      )}

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}

      {!isPlaying && isLoaded && !isBuffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10 focus:outline-none"
          aria-label="Play"
        >
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-primary/30 flex items-center justify-center
                         hover:bg-primary/20 hover:border-primary/60 transition-all duration-200 group-hover:scale-105">
            <Play className="w-7 h-7 text-primary translate-x-0.5" />
          </div>
        </button>
      )}

      {!isLoaded && isVisible && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10 focus:outline-none"
          aria-label="Load video"
        >
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-primary/30 flex items-center justify-center
                         hover:bg-primary/20 hover:border-primary/60 transition-all duration-200">
            <Play className="w-7 h-7 text-primary translate-x-0.5" />
          </div>
        </button>
      )}

      <div
        className={`absolute bottom-0 inset-x-0 z-20 px-4 pb-3 pt-8 transition-all duration-300
          bg-gradient-to-t from-black/80 via-black/40 to-transparent
          ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"}`}
      >
        <input
          ref={seekBarRef}
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 mb-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgb(34,211,238) ${progress}%, rgba(255,255,255,0.15) ${progress}%)`,
          }}
          aria-label="Seek"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center
                         hover:bg-primary/25 hover:border-primary/60 transition-all text-primary"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying
                ? <Pause className="w-3.5 h-3.5" />
                : <Play className="w-3.5 h-3.5 translate-x-px" />
              }
            </button>

            <button
              onClick={toggleMute}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center
                         hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted
                ? <VolumeX className="w-3.5 h-3.5" />
                : <Volume2 className="w-3.5 h-3.5" />
              }
            </button>

            <span className="text-[11px] font-mono text-white/60 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {title && (
              <span className="text-[10px] font-mono text-primary/50 uppercase tracking-wider truncate max-w-[120px]">{title}</span>
            )}
            <button
              onClick={handleFullscreen}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center
                         hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white"
              aria-label="Fullscreen"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgb(34,211,238);
          cursor: pointer;
          box-shadow: 0 0 6px rgba(34,211,238,0.6);
        }
        input[type=range]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border: none;
          border-radius: 50%;
          background: rgb(34,211,238);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
