import React from 'react';

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({ children, className = '', gradient = false, ...props }) => {
  return (
    <div
      {...props}
      className={`rounded-[2rem] p-6 transition-all duration-300 relative overflow-hidden border ${
        gradient
          ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 border-indigo-500/30 text-white shadow-xl shadow-indigo-950/40'
          : 'bg-zinc-900/90 border-zinc-800/90 text-zinc-100 hover:border-zinc-700/80 shadow-lg shadow-black/50'
      } ${className}`}
    >
      {gradient && (
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {children}
    </div>
  );
};
