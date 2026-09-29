import { BrainCircuit } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 18, text: 'text-base', container: 'gap-1.5' },
  md: { icon: 24, text: 'text-lg', container: 'gap-2' },
  lg: { icon: 32, text: 'text-2xl', container: 'gap-2.5' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={`flex items-center ${s.container} ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary-500/20 rounded-lg blur-md" />
        <div className="relative bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg p-1.5 flex items-center justify-center">
          <BrainCircuit size={s.icon} className="text-white" strokeWidth={2.5} />
        </div>
      </div>
      {showText && (
        <span className={`font-bold ${s.text} tracking-tight text-ink-900`}>
          Contexta
        </span>
      )}
    </div>
  );
}
