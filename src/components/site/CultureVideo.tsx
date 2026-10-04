import { useEffect, useRef, useState } from "react";
import { useMotionPrefs } from "@/lib/motion";
import videoAsset from "@/assets/culture-street-dance.webm.asset.json";
import posterAsset from "@/assets/culture-poster.jpg.asset.json";

export function CultureVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
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
    if (!visible || reduce || systemReduce) {
      video.pause();
      return;
    }
    void video.play().catch(() => {});
  }, [visible, reduce, systemReduce, failed]);

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
          muted
          loop
          preload="none"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}