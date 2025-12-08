import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  color?: 'default' | 'ok' | 'warning' | 'critical';
}

export const MetricCard = ({ label, value, unit, icon: Icon, color = 'default' }: MetricCardProps) => {
  const colorClasses = {
    default: 'text-foreground',
    ok: 'text-status-ok',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
  };

  return (
    <Card className="p-3 bg-card border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${colorClasses[color]}`}>
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
        </div>
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
      </div>
    </Card>
  );
};
