import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

/**
 * ActionSlider - Professional "Swipe to Confirm" UI Component.
 */
export const ActionSlider = ({ 
  label = "Slide to Confirm", 
  onConfirm, 
  disabled = false,
  color = "bg-[#86bf24]",
  successLabel = "Confirmed ✓",
  size = "normal"
}) => {
  const [progress, setProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const containerRef = useRef(null);
  const controls = useAnimation();
  const isCompact = size === 'compact';

  // Reset when disabled state changes
  useEffect(() => {
    if (disabled) {
      setProgress(0);
      setIsSuccess(false);
    }
  }, [disabled]);

  const handleDrag = (event, info) => {
    if (disabled || isSuccess) return;
    
    const containerWidth = containerRef.current?.offsetWidth || 300;
    const handleWidth = isCompact ? 42 : 56;
    const paddingOffset = isCompact ? 8 : 12; // p-1 = 4px each side vs p-1.5 = 6px each side
    const totalPath = Math.max(1, containerWidth - handleWidth - paddingOffset);
    
    const currentProgress = Math.min(1, Math.max(0, (info.point.x - containerRef.current.getBoundingClientRect().left) / totalPath));
    setProgress(currentProgress);
  };

  const handleDragEnd = async (event, info) => {
    if (disabled || isSuccess) return;

    if (progress > 0.8 || info.offset.x > (isCompact ? 110 : 150)) {
      setIsSuccess(true);
      setProgress(1);
      if (onConfirm) {
        try {
          await onConfirm();
        } catch (error) {
          setIsSuccess(false);
          setProgress(0);
          controls.start({ x: 0 });
        }
      }
    } else {
      setProgress(0);
      controls.start({ x: 0 });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isCompact ? 'h-[50px] p-1' : 'h-[68px] p-1.5'} rounded-full overflow-hidden transition-all duration-300 bg-gray-950 shadow-lg shadow-black/10`}
    >
      {/* Background Track */}
      <div className={`absolute inset-y-0 ${isCompact ? 'left-[54px] right-3 text-[10px] tracking-[0.1em]' : 'left-[76px] right-5 text-[11px] tracking-[0.14em]'} flex items-center justify-center text-center font-bold uppercase leading-none whitespace-nowrap transition-opacity duration-300 ${
        isSuccess ? 'opacity-0' : disabled ? 'text-white/70' : 'text-white/88'
      }`}>
        {disabled ? 'Action Locked' : label}
      </div>

      {/* Dynamic Progress Fill */}
      <motion.div 
        className={`absolute inset-0 ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ 
          width: isSuccess ? '100%' : `${progress * 100}%`,
          opacity: disabled ? 0 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />

      {/* Success View */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-y-0 ${isCompact ? 'left-[54px] right-3 text-xs tracking-[0.1em]' : 'left-[76px] right-5 text-sm tracking-[0.14em]'} flex items-center justify-center text-center text-white font-bold uppercase leading-none z-30`}
          >
            {successLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Handle */}
      <motion.div
        drag={disabled || isSuccess ? false : "x"}
        dragConstraints={{ left: 0, right: containerRef.current?.offsetWidth ? containerRef.current.offsetWidth - (isCompact ? 50 : 68) : 250 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`relative ${isCompact ? 'w-[42px] h-[42px]' : 'w-14 h-14'} rounded-full flex items-center justify-center z-20 cursor-grab active:cursor-grabbing shadow-xl transition-colors ${
          disabled ? 'bg-gray-200 text-gray-400' : 
          isSuccess ? 'bg-white text-[#86bf24]' : 'bg-white text-gray-950'
        }`}
      >
        <ChevronRight className={`${isCompact ? 'w-5 h-5' : 'w-8 h-8'} transition-transform duration-300 ${isSuccess ? 'scale-110' : ''}`} />
      </motion.div>
    </div>
  );
};

export default ActionSlider;
