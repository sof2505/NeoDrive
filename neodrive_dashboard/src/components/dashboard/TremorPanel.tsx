import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TremorSpectrum } from "@/hooks/useRealtimeData";
import { MetricCard } from "./MetricCard";
import { Activity, Download } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/exportToCSV";
import { useToast } from "@/hooks/use-toast";

interface TremorPanelProps {
  spectrum: TremorSpectrum[];
  power: number;
  frequency: number;
}

export const TremorPanel = ({ spectrum, power, frequency }: TremorPanelProps) => {
  const { toast } = useToast();
  
  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    return spectrum.map(point => ({
      frequency: point.frequency.toFixed(1),
      power: point.power
    }));
  }, [spectrum]);

  const handleExport = () => {
    if (spectrum.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay datos del espectro para exportar",
        variant: "destructive"
      });
      return;
    }
    
    const exportData = spectrum.map(point => ({
      frequency_hz: point.frequency.toFixed(2),
      power: point.power.toFixed(4)
    }));
    
    exportToCSV(exportData, `espectro_temblor_${Date.now()}`);
    
    toast({
      title: "Exportación exitosa",
      description: `${spectrum.length} puntos del espectro exportados a CSV`
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Espectro de Temblor (4-12 Hz)</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8 gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="frequency" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="power" fill="hsl(var(--industrial-orange))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Potencia"
          value={power}
          unit="W"
          icon={Activity}
          color={power > 0.3 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Frecuencia Pico"
          value={frequency}
          unit="Hz"
          icon={Activity}
        />
      </div>
    </div>
  );
};
