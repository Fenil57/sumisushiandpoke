import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingsContext";

// Pre-extracted frame configuration
const FRAME_COUNT = 60;
const FRAME_PATH = "/frames/frame-";
const FRAME_EXT = ".webp";

// Generate frame URL from index (1-based, zero-padded to 4 digits)
function getFrameUrl(index: number): string {
  return `${FRAME_PATH}${String(index).padStart(4, "0")}${FRAME_EXT}`;
}

export function RamenHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const rafIdRef = useRef(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const { t } = useTranslation();
  const { settings } = useSettings();

  // Parallax effects for text
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  // Paint a frame to the canvas
  const paintFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const images = imagesRef.current;
    if (!canvas || images.length === 0) return;

    const idx = Math.max(
      0,
      Math.min(images.length - 1, Math.round(frameIndex)),
    );
    const img = images[idx];
    if (!img || !img.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to image dimensions (once)
    if (
      canvas.width !== img.naturalWidth ||
      canvas.height !== img.naturalHeight
    ) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }

    ctx.drawImage(img, 0, 0);
  }, []);

  // Preload all frame images
  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    // Load first frame immediately for instant display
    const firstImage = new Image();
    firstImage.src = getFrameUrl(1);
    firstImage.onload = () => {
      if (cancelled) return;
      images[0] = firstImage;
      // Paint first frame to canvas immediately
      imagesRef.current = images;
      paintFrame(0);
    };

    // Load all frames in parallel
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        if (cancelled) return;
        loadedCount++;
        images[i - 1] = img;

        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = images;
          setImagesLoaded(true);
          // Paint the frame matching current scroll
          const progress = scrollYProgress.get();
          const frame = progress * (FRAME_COUNT - 1);
          currentFrameRef.current = frame;
          targetFrameRef.current = frame;
          paintFrame(frame);
        }
      };
    }

    return () => {
      cancelled = true;
      imagesRef.current = [];
    };
  }, [paintFrame, scrollYProgress]);

  // Scroll-driven animation loop
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      targetFrameRef.current = latest * (FRAME_COUNT - 1);
    });

    const loop = () => {
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;
      const diff = target - current;

      // Direct frame mapping when images are loaded — no unnecessary smoothing
      // Small lerp only to avoid single-pixel jitter
      if (Math.abs(diff) > 0.3) {
        currentFrameRef.current += diff * 0.25;
        paintFrame(currentFrameRef.current);
      } else if (Math.abs(diff) > 0.01) {
        currentFrameRef.current = target;
        paintFrame(target);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      unsubscribe();
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [scrollYProgress, paintFrame]);

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-[#f9f6f0]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden flex flex-col items-center pt-[15vh] px-4 md:px-8">
        {/* Hero Typography */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative z-30 flex flex-col items-center text-center"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="w-12 h-[1px] bg-[#c92a2a]"></span>
            <p className="text-xs md:text-sm text-[#c92a2a] font-medium tracking-[0.4em] uppercase">
              {t("hero.authentic")}
            </p>
            <span className="w-12 h-[1px] bg-[#c92a2a]"></span>
          </div>

          <h1 className="text-[clamp(3.5rem,8vw,8rem)] font-serif font-bold tracking-tight leading-[1] text-[#1c1c1c] mb-16 drop-shadow-sm">
            {t("hero.trueTaste")} <br />
            <span className="italic font-light text-[#1c1c1c]/80">
              {t("hero.ofUmami")}
            </span>
          </h1>
        </motion.div>

        {/* Canvas-based Frame Sequence Container */}
        <div className="absolute bottom-0 left-0 right-0 z-10 w-full h-[70vh] md:h-[85vh] overflow-hidden pointer-events-none">
          {/* Top blend gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 md:h-64 bg-gradient-to-b from-[#f9f6f0] via-[#f9f6f0]/80 to-transparent z-20" />

          <motion.div
            style={{ scale: videoScale, y: videoY }}
            className="w-full h-full relative"
          >
            {/* Static poster — first frame shown instantly via <img> */}
            <img
              src={getFrameUrl(1)}
              alt=""
              className="w-full h-full object-cover absolute inset-0"
              style={{
                opacity: imagesLoaded ? 0 : 1,
                transition: "opacity 0.3s ease",
                pointerEvents: "none",
              }}
            />

            {/* Canvas — renders scroll-driven frame sequence */}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover absolute inset-0"
              style={{
                willChange: "auto",
                transform: "translateZ(0)",
              }}
            />
          </motion.div>
        </div>

        {/* Floating Japanese Text */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="absolute left-8 top-1/4 hidden lg:block vertical-text text-5xl font-serif text-[#1c1c1c] opacity-10 z-0"
        >
          伝統の味
        </motion.div>
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="absolute right-8 top-1/4 hidden lg:block vertical-text text-5xl font-serif text-[#1c1c1c] opacity-10 z-0"
        >
          最高品質
        </motion.div>
      </div>
    </section>
  );
}
