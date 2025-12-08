import { Card } from "@/components/ui/card";
import { StatusLight } from "./StatusLight";

interface FatigueGaugeProps {
  value: number;
  status: 'OK' | 'FATIGA' | 'CRÍTICO';
}

export const FatigueGauge = ({ value, status }: FatigueGaugeProps) => {
  const percentage = Math.min(100, Math.max(0, value));
  
  const getColor = () => {
    if (percentage > 70) return 'bg-status-critical';
    if (percentage > 50) return 'bg-status-warning';
    return 'bg-status-ok';
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Índice de Fatiga</h3>
        <div className="flex items-center gap-2">
          <StatusLight status={status} size="md" />
          <span className={`text-sm font-bold ${
            status === 'CRÍTICO' ? 'text-status-critical' :
            status === 'FATIGA' ? 'text-status-warning' :
            'text-status-ok'
          }`}>
            {status}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-3xl font-bold text-foreground">{percentage.toFixed(1)}%</div>
        
        <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`absolute left-0 top-0 h-full transition-all duration-300 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span className="text-status-warning">50%</span>
          <span className="text-status-critical">70%</span>
          <span>100%</span>
        </div>
      </div>
    </Card>
  );
};
