import React from "react";
import { motion, useScroll, useSpring, useTransform, MotionValue } from "motion/react";

interface KineticGridItemProps {
  image: string;
  scrollVelocity: MotionValue<number>;
  key?: React.Key;
}

const KineticGridItem = ({ image, scrollVelocity }: KineticGridItemProps) => {
  // Smooth the velocity value for a more gradual effect
  const smoothedVelocity = useSpring(scrollVelocity, {
    mass: 0.1,
    stiffness: 80,
    damping: 40,
  });

  // Transform the smoothed velocity into a skew value.
  // The faster the scroll, the more it skews.
  const skew = useTransform(smoothedVelocity, [-1500, 0, 1500], [-15, 0, 15]);

  return (
    <motion.div
      className="w-full h-80 relative overflow-hidden rounded-lg shadow-xl"
      style={{ skewX: skew }}
    >
      <img
        src={image}
        alt="Sumi Sushi Restaurant"
        className="absolute inset-0 h-full w-full object-cover shadow-2xl"
        style={{
          transform: "scale(1.2)", // Zoomed in to prevent gaps during skew
        }}
      />
    </motion.div>
  );
};

interface KineticScrollGalleryProps {
  images?: string[];
}

export default function KineticScrollGallery({ images }: KineticScrollGalleryProps) {
  const { scrollYProgress } = useScroll();

  // Framer Motion's useScroll provides scrollYVelocity, which is a MotionValue
  // representing the velocity of the scroll in pixels per second.
  const scrollYVelocity = useTransform(
    scrollYProgress,
    [0, 1],
    [0, 1000],
    { clamp: false }
  );

  const fallbackImages = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&q=80&w=1200",
  ];

  const galleryImages = images || fallbackImages;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 py-10">
      {galleryImages.map((img, index) => (
        <KineticGridItem key={index} image={img} scrollVelocity={scrollYVelocity} />
      ))}
    </div>
  );
}
