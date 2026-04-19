import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { ProjectMedia } from "@/data/projects";
import { useLanguage } from "@/contexts/LanguageContext";
import { VideoPlayer } from "./VideoPlayer";

function WatermarkOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-end justify-end p-3 z-10">
      <span
        className="text-[10px] font-mono font-bold tracking-widest uppercase select-none"
        style={{ color: "rgba(34,211,238,0.35)", transform: "rotate(-8deg)", transformOrigin: "bottom right" }}
      >
        INFINITY.TECH
      </span>
    </div>
  );
}

function CircuitPlaceholder({ caption }: { caption?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-card to-background">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMzQsMjExLDIzOCwwLjQpIi8+PC9zdmc+")`,
        }}
      />
      <ImageOff className="w-8 h-8 text-muted-foreground/30 mb-2" />
      {caption && (
        <p className="text-[10px] font-mono text-muted-foreground/40 text-center px-4 max-w-[160px]">{caption}</p>
      )}
    </div>
  );
}

interface MediaGalleryProps {
  media: ProjectMedia[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const { lang } = useLanguage();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const images = media.filter(m => m.type === "image");
  const videos = media.filter(m => m.type === "video" && m.id !== "hero-video");

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx(i => (i !== null ? (i - 1 + images.length) % images.length : 0));
  const next = () => setLightboxIdx(i => (i !== null ? (i + 1) % images.length : 0));

  const getCaption = (m: ProjectMedia) => lang === "ar" && m.captionAr ? m.captionAr : m.caption;

  return (
    <div className="space-y-10">
      {images.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-4">Image Gallery</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <motion.button
                key={img.id}
                onClick={() => openLightbox(idx)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative aspect-video rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-colors duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt={getCaption(img) || "Project media"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <CircuitPlaceholder caption={getCaption(img)} />
                )}
                <WatermarkOverlay />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-white/90 bg-black/50 px-3 py-1 rounded-full">
                    View
                  </span>
                </div>
                {getCaption(img) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-[10px] font-mono text-white/80 truncate">{getCaption(img)}</p>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-4">Videos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map(vid => (
              <div key={vid.id} className="space-y-1.5">
                {vid.url && vid.url.includes("youtube") ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-card">
                    <iframe
                      src={vid.url}
                      className="w-full h-full"
                      allowFullScreen
                      title={getCaption(vid) || "Project video"}
                    />
                  </div>
                ) : vid.url ? (
                  <VideoPlayer
                    src={vid.url}
                    poster={(vid as { thumbnail?: string }).thumbnail}
                    title={getCaption(vid) || undefined}
                    className="rounded-xl border border-border"
                  />
                ) : (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-card">
                    <CircuitPlaceholder caption={getCaption(vid)} />
                    <WatermarkOverlay />
                  </div>
                )}
                {getCaption(vid) && (
                  <p className="text-[11px] font-mono text-muted-foreground px-1">{getCaption(vid)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {media.length === 0 && (
        <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl">
          <ImageOff className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No media uploaded yet</p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && images[lightboxIdx] && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex items-center justify-center px-4"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-4xl w-full max-h-[80vh] rounded-2xl overflow-hidden border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative aspect-video">
                {images[lightboxIdx].url ? (
                  <img
                    src={images[lightboxIdx].url}
                    alt={getCaption(images[lightboxIdx]) || ""}
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <CircuitPlaceholder caption={getCaption(images[lightboxIdx])} />
                )}
                <WatermarkOverlay />
              </div>
              {getCaption(images[lightboxIdx]) && (
                <div className="bg-black/80 px-6 py-3">
                  <p className="text-sm font-mono text-white/70">{getCaption(images[lightboxIdx])}</p>
                </div>
              )}

              <button onClick={closeLightbox} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>

              {images.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setLightboxIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === lightboxIdx ? "bg-primary" : "bg-white/30"}`} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
