import { MetricCard } from "./MetricCard";
import { Thermometer, TrendingUp, Zap } from "lucide-react";

interface TemperaturePanelProps {
  temperature: number;
  tempRate: number;
  thermalEnergy: number;
}

export const TemperaturePanel = ({ temperature, tempRate, thermalEnergy }: TemperaturePanelProps) => {
  const getTempColor = () => {
    if (temperature > 36) return 'critical';
    if (temperature > 34) return 'warning';
    return 'ok';
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        label="Temperatura"
        value={temperature}
        unit="°C"
        icon={Thermometer}
        color={getTempColor()}
      />
      <MetricCard
        label="Cambio de temperatura"
        value={tempRate}
        unit="°C/s"
        icon={TrendingUp}
        color={Math.abs(tempRate) > 0.15 ? 'warning' : 'default'}
      />
      <MetricCard
        label="Energía Térmica"
        value={thermalEnergy}
        unit="J"
        icon={Zap}
      />
    </div>
  );
};
