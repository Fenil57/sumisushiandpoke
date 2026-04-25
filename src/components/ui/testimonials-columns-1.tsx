import React from "react";
import { motion } from "motion/react";

interface Testimonial {
  text: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, name, role }, i) => (
                <div 
                  className="p-8 md:p-10 rounded-[2.5rem] border border-[var(--color-washi)]/5 bg-[var(--color-sumi)]/50 shadow-2xl backdrop-blur-sm max-w-[320px] w-full" 
                  key={i}
                >
                  <div className="text-[var(--color-washi)]/80 italic font-serif leading-relaxed mb-6 text-sm md:text-base">"{text}"</div>
                  <div className="flex justify-center w-full">
                    <div className="flex flex-col items-center text-center">
                      <div className="font-bold tracking-widest leading-5 text-[var(--color-shu)] uppercase text-[10px] md:text-xs">{name}</div>
                      <div className="leading-5 opacity-40 tracking-widest uppercase text-[9px] md:text-[10px] mt-1 text-[var(--color-washi)]">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
