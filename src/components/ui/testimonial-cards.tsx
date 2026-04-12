import * as React from 'react';
import { motion } from 'motion/react';

interface TestimonialCardProps {
  handleShuffle: () => void;
  testimonial: string;
  position: string;
  author: string;
  img: string;
}

export function TestimonialCard({ handleShuffle, testimonial, position, author, img }: TestimonialCardProps) {
  const dragRef = React.useRef(0);
  const isFront = position === "front";

  return (
    <motion.div
      style={{
        zIndex: position === "front" ? "2" : position === "middle" ? "1" : "0"
      }}
      animate={{
        rotate: position === "front" ? "-6deg" : position === "middle" ? "0deg" : "6deg",
        x: position === "front" ? "0%" : position === "middle" ? "33%" : "66%",
        scale: position === "front" ? 1 : 0.95
      }}
      drag={true}
      dragElastic={0.35}
      dragListener={isFront}
      dragConstraints={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onDragStart={(e: any) => {
        dragRef.current = e.clientX || (e.touches && e.touches[0].clientX);
      }}
      onDragEnd={(e: any) => {
        const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        if (dragRef.current - clientX > 100) {
          handleShuffle();
        }
        dragRef.current = 0;
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`absolute left-0 top-0 grid h-[380px] w-[280px] md:h-[450px] md:w-[350px] select-none place-content-center space-y-6 rounded-2xl border-2 border-[var(--color-washi)]/5 bg-[var(--color-sumi)] p-6 shadow-2xl backdrop-blur-md ${
        isFront ? "cursor-grab active:cursor-grabbing border-[var(--color-shu)]/20" : "opacity-40 grayscale"
      }`}
    >
      <div className="relative mx-auto h-24 w-24 md:h-32 md:w-32">
        <img
          src={img}
          alt={`Avatar of ${author}`}
          className="pointer-events-none h-full w-full rounded-full border-2 border-[var(--color-washi)]/10 bg-[var(--color-washi)]/5 object-cover"
        />
        <div className="absolute -top-4 -right-4 text-6xl text-[var(--color-shu)] font-serif leading-none opacity-20 select-none">"</div>
      </div>
      
      <span className="text-center text-sm md:text-lg italic text-[var(--color-washi)]/80 font-serif leading-relaxed px-2">
        {testimonial}
      </span>
      
      <div className="text-center space-y-1">
        <span className="block text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-[var(--color-shu)]">
          {author}
        </span>
      </div>
    </motion.div>
  );
}
