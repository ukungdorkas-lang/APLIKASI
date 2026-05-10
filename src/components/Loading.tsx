import React from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  fullPage = false, 
  message = "Memuat Data..." 
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center"
        >
          <Flame className="w-10 h-10 text-brand-red" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-brand-red rounded-full filter blur-xl"
        />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">
        {message}
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[200] bg-brand-dark/95 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full py-20 flex items-center justify-center">
      {content}
    </div>
  );
};

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
);
