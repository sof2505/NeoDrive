import { cn } from "@/lib/utils";

interface StatusLightProps {
  status: 'OK' | 'FATIGA' | 'CRÍTICO';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusLight = ({ status, size = 'md' }: StatusLightProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const colorClasses = {
    OK: 'bg-status-ok shadow-[0_0_15px_hsl(var(--status-ok))]',
    FATIGA: 'bg-status-warning shadow-[0_0_15px_hsl(var(--status-warning))]',
    CRÍTICO: 'bg-status-critical shadow-[0_0_15px_hsl(var(--status-critical))] animate-pulse',
  };

  return (
    <div className={cn(
      'rounded-full transition-all duration-300',
      sizeClasses[size],
      colorClasses[status]
    )} />
  );
};
