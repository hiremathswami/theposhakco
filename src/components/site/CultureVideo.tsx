import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMotionPrefs } from "@/lib/motion";
import videoAsset from "@/assets/culture-street-dance.mp4.asset.json";
import posterAsset from "@/assets/culture-poster.jpg.asset.json";

export function CultureVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [visible, setVisible] = useState(false);
  const [systemReduce, setSystemReduce] = useState(false);
  const [failed, setFailed] = useState(false);
  const { reduce } = useMotionPrefs();

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduce(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.25 });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    if (!visible || reduce || systemReduce || manuallyPaused.current) {
      video.pause();
      return;
    }
    void video.play().catch(() => setPlaying(false));
  }, [visible, reduce, systemReduce, failed]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video || failed) return;
    if (playing) {
      manuallyPaused.current = true;
      video.pause();
    } else {
      manuallyPaused.current = false;
      void video.play().catch(() => setPlaying(false));
    }
  };

  return (
    <div ref={wrapperRef} className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
      {failed ? (
        <img src={posterAsset.url} alt="Two people wearing graphic tees outside an arched building" className="h-full w-full object-cover" />
      ) : (
        <video
          ref={videoRef}
          src={videoAsset.url}
          poster={posterAsset.url}
          aria-label="ThePoshakCo streetwear film with two models in graphic tees"
          className="h-full w-full object-cover"
          playsInline
          muted={muted}
          loop
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
        />
      )}
      {!failed && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <Button type="button" variant="outline" size="icon" onClick={togglePlayback} aria-label={playing ? "Pause video" : "Play video"} title={playing ? "Pause video" : "Play video"} className="rounded-sm border-border bg-background/90 hover:bg-background">
            {playing ? <Pause /> : <Play />}
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Unmute video" : "Mute video"} title={muted ? "Unmute video" : "Mute video"} className="rounded-sm border-border bg-background/90 hover:bg-background">
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
        </div>
      )}
    </div>
  );
}