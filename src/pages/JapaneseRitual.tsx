import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { SEOHead } from "../components/SEOHead";
import { playCurtainBrush, unlockCurtainAudio } from "../lib/curtainAudio";

type RitualObject = {
  id: string;
  name: string;
  japaneseName: string;
  title: string;
  phrase: string;
  description: string;
  material: string;
  sourceLabel: string;
  sourceUrl: string;
  image: string;
  imageAlt: string;
  charPool: string;
  colors: string[];
  imageClassName: string;
};

const OBJECTS: RitualObject[] = [
  {
    id: "kanmuri",
    name: "Kanmuri",
    japaneseName: "冠",
    title: "A courtly silhouette, held in stillness.",
    phrase: "Lacquer, gold, and ceremony — a form designed to make presence visible.",
    description:
      "Kanmuri is formal court headwear. Here, its quiet architecture becomes a place where words of hospitality can gather and sway.",
    material: "Lacquered form · antique gold · silk cord",
    sourceLabel: "The Met — court dress in The Tale of Genji",
    sourceUrl: "https://resources.metmuseum.org/resources/metpublications/pdf/The_Tale_of_Genji_A_Japanese_Classic_Illuminated.pdf",
    image: "/images/ritual/sumi-kanmuri.png",
    imageAlt: "Kanmuri-inspired Japanese ceremonial headdress",
    charPool: "雅冠儀礼宮廷和敬静寂美意心結おもてなし季節光余白",
    colors: ["#f4e8cf", "#d9ad57", "#c96a58", "#e7ca84"],
    imageClassName: "w-[min(76vw,47rem)] md:w-[min(53vw,42rem)]",
  },
  {
    id: "kabuto",
    name: "Kabuto",
    japaneseName: "兜",
    title: "Ridges of iron, lacquered for memory.",
    phrase: "A helmet is not only protection; it is craft, identity, and the language of a period.",
    description:
      "The ridged suji-kabuto form was made from radiating plates. This imagined helmet lets the character fringe echo the rhythm of its lacing and guard.",
    material: "Iron · lacquer · gold · indigo silk",
    sourceLabel: "The Met — Suji-kabuto, 18th century",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/27588",
    image: "/images/ritual/sumi-kabuto.png",
    imageAlt: "Japanese lacquered kabuto helmet with a gold crescent crest",
    charPool: "武勇鉄漆鎧光月静剣道守護志誠風山川歴史手仕事結",
    colors: ["#d7b25f", "#9bb7d8", "#f1e6c8", "#607ba8"],
    imageClassName: "w-[min(78vw,48rem)] md:w-[min(55vw,43rem)]",
  },
  {
    id: "kanzashi",
    name: "Hana-kanzashi",
    japaneseName: "花簪",
    title: "Seasons, worn close to the heart.",
    phrase: "A flower can hold a month, a memory, and the patience of the hand that shaped it.",
    description:
      "Hana-kanzashi are seasonal flower ornaments. Their silk petals, tiny bells, and tassels turn the changing year into a finely made gesture.",
    material: "Dyed silk · washi · wire · gold pins",
    sourceLabel: "Kyoto Travel — handmade hana-kanzashi",
    sourceUrl: "https://kyoto.travel/en/travel-inspiration/kyoto-craftmanship-small-production-crafts/",
    image: "/images/ritual/sumi-kanzashi.png",
    imageAlt: "Japanese floral hana-kanzashi ornament with silk flowers and tassels",
    charPool: "花簪春桜梅絹紙鈴季節香り彩り手仕事京和花びら結心",
    colors: ["#f5dfcf", "#e68a9a", "#c94f56", "#d5ad55", "#9ab38c"],
    imageClassName: "w-[min(84vw,48rem)] md:w-[min(56vw,44rem)]",
  },
];

type CurtainNode = {
  x: number;
  y: number;
  px: number;
  py: number;
  homeX: number;
  homeY: number;
  character: string;
  color: string;
};

function CharacterFringe({ object, onBrush, onActivate }: { object: RitualObject; onBrush: (intensity: number) => void; onActivate: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brushRef = useRef(onBrush);

  useEffect(() => {
    brushRef.current = onBrush;
  }, [onBrush]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let columns: CurtainNode[][] = [];
    let alphaPixels: Uint8ClampedArray | null = null;
    let imageWidth = 0;
    let imageHeight = 0;
    let lastLayoutKey = "";
    let reveal = 0;
    let revealAt = performance.now() + 180;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
    let columnGap = 11;
    let rowGap = 12;
    let fontSize = 9.5;

    const getImage = () => document.querySelector<HTMLImageElement>(`img[data-ritual-object="${object.id}"]`);

    const sampleImage = (image: HTMLImageElement) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = image.naturalWidth;
      offscreen.height = image.naturalHeight;
      const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offscreenContext || !image.naturalWidth || !image.naturalHeight) return;
      offscreenContext.drawImage(image, 0, 0);
      alphaPixels = offscreenContext.getImageData(0, 0, image.naturalWidth, image.naturalHeight).data;
      imageWidth = image.naturalWidth;
      imageHeight = image.naturalHeight;
    };

    const contourY = (canvasX: number) => {
      const image = getImage();
      if (!image || !alphaPixels || !imageWidth || !imageHeight) return null;
      const imageRect = image.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const pageX = canvasRect.left + canvasX;
      if (pageX < imageRect.left || pageX > imageRect.right) return null;
      const imageX = Math.max(0, Math.min(imageWidth - 1, Math.round(((pageX - imageRect.left) / imageRect.width) * imageWidth)));
      const spread = Math.max(1, Math.round((columnGap * imageWidth) / imageRect.width / 2));

      for (let y = imageHeight - 1; y >= 0; y -= 1) {
        for (let x = Math.max(0, imageX - spread); x <= Math.min(imageWidth - 1, imageX + spread); x += 1) {
          if (alphaPixels[(y * imageWidth + x) * 4 + 3] > 28) {
            return imageRect.top + (y / imageHeight) * imageRect.height - canvasRect.top;
          }
        }
      }
      return null;
    };

    const curtainAnchorY = (canvasX: number) => {
      let closest: CurtainNode[] | null = null;
      let closestDistance = Infinity;
      for (const chain of columns) {
        const distance = Math.abs(chain[0].homeX - canvasX);
        if (distance < closestDistance) {
          closest = chain;
          closestDistance = distance;
        }
      }
      return closestDistance <= columnGap * 1.5 ? closest?.[0].homeY ?? null : null;
    };

    const random = (seed: number) => {
      const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return value - Math.floor(value);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const compactLayout = width < 640;
      columnGap = compactLayout ? 14 : 11;
      rowGap = compactLayout ? 13 : 12;
      fontSize = compactLayout ? 8.6 : 9.5;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const image = getImage();
      if (!image || !alphaPixels) return;
      const imageRect = image.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const layoutKey = [width, height, imageRect.left - canvasRect.left, imageRect.top - canvasRect.top, imageRect.width, imageRect.height]
        .map((value) => Math.round(value * 10) / 10)
        .join(":");
      if (layoutKey === lastLayoutKey) return;
      lastLayoutKey = layoutKey;
      const startX = Math.max(0, imageRect.left - canvasRect.left);
      const endX = Math.min(width, imageRect.right - canvasRect.left);
      columns = [];

      for (let x = startX; x <= endX; x += columnGap) {
        const anchorY = contourY(x);
        if (anchorY === null || anchorY > height - rowGap * 4) continue;
        const available = height - anchorY - 22;
        const seed = Math.floor(x);
        const density = compactLayout ? 0.43 + random(seed) * 0.15 : 0.67 + random(seed) * 0.26;
        const rows = Math.max(3, Math.min(compactLayout ? 20 : 34, Math.floor((available / rowGap) * density)));
        const start = Math.floor(random(seed * 4.3) * object.charPool.length);
        const chain: CurtainNode[] = [];

        for (let row = 0; row < rows; row += 1) {
          const homeY = anchorY + 5 + row * rowGap;
          const collapsedY = anchorY + 5 + row * 1.4;
          chain.push({
            x,
            y: reducedMotion ? homeY : collapsedY,
            px: x,
            py: reducedMotion ? homeY : collapsedY,
            homeX: x + (random(seed + row) - 0.5) * 1.2,
            homeY,
            character: object.charPool[(start + row) % object.charPool.length],
            color: object.colors[Math.floor(random(seed * 1.7 + Math.floor(row / 5)) * object.colors.length)],
          });
        }
        columns.push(chain);
      }
    };

    const step = () => {
      const radius = 112;
      const radiusSquared = radius * radius;
      for (const chain of columns) {
        for (let index = 1; index < chain.length; index += 1) {
          const node = chain[index];
          let vx = (node.x - node.px) * 0.955;
          let vy = (node.y - node.py) * 0.955;
          node.px = node.x;
          node.py = node.y;
          vx += (node.homeX - node.x) * 0.012;
          vy += (node.homeY - node.y) * 0.012;

          if (pointer.active) {
            const dx = node.x - pointer.x;
            const dy = node.y - pointer.y;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared < radiusSquared && distanceSquared > 0.01) {
              const distance = Math.sqrt(distanceSquared);
              const falloff = (1 - distance / radius) ** 2;
              vx += (dx / distance) * falloff * 0.48 + pointer.vx * falloff * 0.24;
              vy += (dy / distance) * falloff * 0.12 + pointer.vy * falloff * 0.1;
            }
          }
          node.x += vx;
          node.y += vy;
        }

        for (let pass = 0; pass < 2; pass += 1) {
          chain[0].x = chain[0].homeX;
          chain[0].y = chain[0].homeY;
          for (let index = 1; index < chain.length; index += 1) {
            const previous = chain[index - 1];
            const node = chain[index];
            let dx = node.x - previous.x;
            let dy = node.y - previous.y;
            const distance = Math.max(Math.hypot(dx, dy), 0.001);
            const correction = (distance - rowGap) / distance;
            if (index === 1) {
              node.x -= dx * correction;
              node.y -= dy * correction;
            } else {
              dx *= correction * 0.5;
              dy *= correction * 0.5;
              previous.x += dx;
              previous.y += dy;
              node.x -= dx;
              node.y -= dy;
            }
          }
        }
      }
      pointer.vx *= 0.82;
      pointer.vy *= 0.82;
    };

    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.font = `500 ${fontSize}px Georgia, "Noto Serif JP", serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      for (const chain of columns) {
        for (let index = 0; index < chain.length; index += 1) {
          const node = chain[index];
          const tail = index / chain.length;
          context.globalAlpha = reveal * Math.max(0.12, 0.88 - Math.max(0, tail - 0.7) * 2.5);
          context.fillStyle = node.color;
          context.fillText(node.character, node.x, node.y);
        }
      }
      context.globalAlpha = 1;
    };

    const animate = () => {
      if (performance.now() >= revealAt) {
        reveal = Math.min(1, reveal + 0.028);
        step();
      }
      draw();
      raf = window.requestAnimationFrame(animate);
    };

    const movePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const inside = x >= 0 && x <= width && y >= 0 && y <= height;
      if (!inside) {
        pointer.active = false;
        return;
      }
      pointer.vx = pointer.active ? pointer.vx * 0.45 + (x - pointer.x) * 0.55 : 0;
      pointer.vy = pointer.active ? pointer.vy * 0.45 + (y - pointer.y) * 0.55 : 0;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      const speed = Math.hypot(pointer.vx, pointer.vy);
      if (speed > 2.4 && y > (curtainAnchorY(x) ?? height)) brushRef.current(Math.min(1, speed / 22));
    };
    const onPointerMove = (event: PointerEvent) => movePointer(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) movePointer(touch.clientX, touch.clientY);
    };

    const onImageReady = () => {
      const image = getImage();
      if (!image || !image.naturalWidth) return;
      sampleImage(image);
      resize();
    };
    const image = getImage();
    if (image?.complete) onImageReady(); else image?.addEventListener("load", onImageReady, { once: true });
    const supportsPointerEvents = "PointerEvent" in window;
    if (supportsPointerEvents) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerdown", onActivate, { passive: true });
    } else {
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      canvas.addEventListener("touchstart", onActivate, { passive: true });
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (reducedMotion) {
      reveal = 1;
      draw();
    } else {
      animate();
    }

    return () => {
      window.cancelAnimationFrame(raf);
      if (supportsPointerEvents) {
        window.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerdown", onActivate);
      } else {
        window.removeEventListener("touchmove", onTouchMove);
        canvas.removeEventListener("touchstart", onActivate);
      }
      observer.disconnect();
    };
  }, [object, onActivate]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-10 h-full w-full" aria-hidden="true" />;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 110 : -110,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 110 : -110,
    opacity: 0,
  }),
};

function RevealingText({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(/(\s+)/).filter(Boolean);
  return (
    <motion.span aria-label={text} className="block" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { delayChildren: delay, staggerChildren: 0.027 } } }}>
      {words.map((word, index) => (
        <motion.span key={`${word}-${index}`} aria-hidden="true" className="inline-block" variants={{ hidden: { opacity: 0, clipPath: "inset(0 100% 0 0)" }, visible: { opacity: 1, clipPath: "inset(0 0% 0 0)" } }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>
          {word === " " ? "\u00a0" : word}
        </motion.span>
      ))}
    </motion.span>
  );
}

function RitualScene({ object, direction, onBrush, onActivate }: { key?: string; object: RitualObject; direction: number; onBrush: (intensity: number) => void; onActivate: () => void }) {
  const isPresent = useIsPresent();

  return (
    <motion.div custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
      {isPresent && <CharacterFringe object={object} onBrush={onBrush} onActivate={onActivate} />}
      <motion.img data-ritual-object={object.id} src={object.image} alt={object.imageAlt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className={`pointer-events-none absolute left-1/2 top-[11vh] md:top-[7vh] z-20 -translate-x-1/2 object-contain drop-shadow-[0_28px_35px_rgba(0,0,0,0.6)] ${object.imageClassName}`} />
      <article className="absolute left-4 top-[27rem] z-30 max-w-[calc(100%-2rem)] border-l border-[#e7c772]/55 bg-[#070d17]/90 py-4 pl-4 pr-3 backdrop-blur-sm md:bottom-12 md:left-12 md:top-auto md:max-w-[20rem] md:bg-transparent md:py-0 md:pl-7 md:pr-0 md:backdrop-blur-none">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[#e7c772]"><RevealingText text={[object.japaneseName, object.name].join(" · ")} delay={0.12} /></p>
        <h1 className="mt-3 font-serif text-3xl leading-[0.95] tracking-tight text-[#f6eedf] md:text-5xl"><RevealingText text={object.title} delay={0.24} /></h1>
        <p className="mt-4 text-sm leading-6 text-[#c9d0dc] md:text-base"><RevealingText text={object.phrase} delay={0.42} /></p>
        <p className="mt-4 text-xs leading-5 text-[#8f9cb0]"><RevealingText text={object.description} delay={0.72} /></p>
        <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#d9bf7b]"><RevealingText text={object.material} delay={1.06} /></p>
        <a href={object.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block font-mono text-[0.62rem] uppercase tracking-[0.15em] text-[#afbad0] underline underline-offset-4 transition hover:text-white"><RevealingText text={object.sourceLabel} delay={1.22} /></a>
      </article>
    </motion.div>
  );
}

export function JapaneseRitual() {
  const [selected, setSelected] = useState(0);
  const [showDetail, setShowDetail] = useState(true);
  const [slideDirection, setSlideDirection] = useState(1);
  const [soundOn, setSoundOn] = useState(false);
  const object = OBJECTS[selected];

  const playBrush = useCallback((intensity: number) => {
    if (soundOn) playCurtainBrush(intensity);
  }, [soundOn]);

  const activateSound = useCallback(() => {
    unlockCurtainAudio();
    setSoundOn(true);
  }, []);

  const changeObject = (index: number) => {
    setSlideDirection(index > selected || (selected === OBJECTS.length - 1 && index === 0) ? 1 : -1);
    setSelected((index + OBJECTS.length) % OBJECTS.length);
  };
  const previousIndex = (selected - 1 + OBJECTS.length) % OBJECTS.length;
  const nextIndex = (selected + 1) % OBJECTS.length;
  const galleryObjects = [previousIndex, selected, nextIndex];

  return (
    <>
      <SEOHead title="Sumi Ritual | Japanese Culture in Motion" description="An interactive Sumi gallery of Japanese cultural forms, animated through sound and character strands." canonicalPath="/ritual" />
      <main className="relative min-h-screen overflow-hidden bg-[#070d17] text-[#f7f0e0] md:h-[100dvh]">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 0.7px, transparent 0.7px)", backgroundSize: "5px 5px" }} />
        <header className="relative z-40 grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#f6e4b8]/10 px-5 py-5 md:px-10 md:py-7">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-sm font-semibold tracking-tight text-[#f5e7c7] transition hover:text-white"><ArrowLeft size={15} /> Sumi</Link>
          <div className="flex justify-center items-center">
            {showDetail ? (
              <button type="button" onClick={() => setShowDetail(false)} className="font-mono text-[0.56rem] uppercase tracking-[0.14em] text-[#b4bdcc] transition hover:text-white md:text-[0.62rem] md:tracking-[0.16em]">
                <span className="md:hidden">Cabinet</span>
                <span className="hidden md:inline">Explore the cabinet</span>
              </button>
            ) : (
              <p className="hidden font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[#b4bdcc] md:block">Cultural Cabinet</p>
            )}
          </div>
          <div className="flex items-center justify-self-end gap-3">
            <button type="button" onClick={() => { unlockCurtainAudio(); setSoundOn((enabled) => !enabled); }} className="grid h-9 w-9 place-items-center border border-[#f5e7c7]/25 bg-[#06101d]/50 text-[#f5e7c7] transition hover:bg-[#f5e7c7]/15" aria-label={soundOn ? "Turn sound off" : "Turn sound on"} aria-pressed={soundOn} title={soundOn ? "Sound on" : "Sound off"}>
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </header>

        {!showDetail ? (
          <section className="relative z-20 mx-auto flex min-h-[calc(100dvh-82px)] max-w-[92rem] items-center justify-center gap-3 overflow-hidden px-3 pb-8 pt-4 md:gap-10 md:px-10" aria-label="Japanese cultural object gallery">
            {galleryObjects.map((objectIndex, position) => {
              const item = OBJECTS[objectIndex];
              const isCenter = position === 1;
              return (
              <motion.button layout key={item.id} type="button" onClick={() => { if (isCenter) setShowDetail(true); else changeObject(objectIndex); }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: isCenter ? 1 : 0.58, y: 0, scale: isCenter ? 1 : 0.78 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }} className={`group relative flex shrink-0 flex-col items-center justify-center overflow-hidden border px-3 py-5 text-center transition-colors duration-300 ${isCenter ? "h-[50vh] w-[64vw] min-w-[14rem] max-w-[38rem] md:h-[66vh] md:w-[48vw] md:min-w-[19rem] border-[#e7c772]/55 bg-[#111d2f]/40" : "h-[35vh] w-[15vw] min-w-[4.5rem] max-w-[17rem] md:h-[43vh] md:w-[20vw] md:min-w-[7rem] border-[#f6e4b8]/10 bg-[#0b1422]/25 hover:border-[#e7c772]/45"}`} aria-label={isCenter ? `Open ${item.name}` : `Bring ${item.name} to the center`}>
                <img src={item.image} alt={item.imageAlt} className="pointer-events-none max-h-[78%] w-[92%] object-contain transition duration-500 group-hover:scale-105" />
                <span className="mt-4 font-mono text-xs tracking-[0.16em] text-[#afbad0]">{item.japaneseName} · {item.name}</span>
                {isCenter && <span className="mt-2 font-mono text-[0.56rem] uppercase tracking-[0.2em] text-[#e7c772]">Open story</span>}
              </motion.button>
              );
            })}
          </section>
        ) : (
          <section className="relative h-[52rem] min-h-[52rem] md:h-[calc(100dvh-82px)] md:min-h-[39rem]" aria-label={`${object.name} interactive scene`}>
            <AnimatePresence custom={slideDirection} initial={false}>
              <RitualScene
                key={object.id}
                object={object}
                direction={slideDirection}
                onBrush={playBrush}
                onActivate={activateSound}
              />
            </AnimatePresence>

            <aside className="absolute right-4 top-6 z-30 flex items-center gap-2 md:bottom-12 md:right-12 md:top-auto md:gap-3" aria-label="Scene controls">
              <button type="button" onClick={() => changeObject(selected - 1)} className="border border-[#f5e7c7]/25 bg-[#06101d]/50 p-3 text-[#f5e7c7] transition hover:bg-[#f5e7c7]/15" aria-label="Previous object"><ChevronLeft size={17} /></button>
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#b7c0ce]">{String(selected + 1).padStart(2, "0")} / {String(OBJECTS.length).padStart(2, "0")}</span>
              <button type="button" onClick={() => changeObject(selected + 1)} className="border border-[#f5e7c7]/25 bg-[#06101d]/50 p-3 text-[#f5e7c7] transition hover:bg-[#f5e7c7]/15" aria-label="Next object"><ChevronRight size={17} /></button>
            </aside>

            <p className="absolute right-5 top-5 z-30 hidden max-w-48 text-right font-mono text-[0.6rem] uppercase leading-5 tracking-[0.17em] text-[#aeb8c8] md:block">Move slowly through the character fringe</p>
          </section>
        )}
      </main>
    </>
  );
}
