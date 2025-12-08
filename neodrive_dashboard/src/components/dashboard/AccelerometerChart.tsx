import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AccelerometerData } from "@/hooks/useAccelerometer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/exportToCSV";
import { useToast } from "@/hooks/use-toast";

interface AccelerometerChartProps {
  data: AccelerometerData[];
}

export const AccelerometerChart = ({ data }: AccelerometerChartProps) => {
  const { toast } = useToast();
  
  const chartData = data.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    timestamp: new Date(point.timestamp).toISOString(),
    x: parseFloat(point.x.toFixed(2)),
    y: parseFloat(point.y.toFixed(2)),
    z: parseFloat(point.z.toFixed(2)),
    magnitud: parseFloat(point.magnitude.toFixed(2)),
  }));

  const handleExport = () => {
    if (data.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay datos históricos para exportar",
        variant: "destructive"
      });
      return;
    }
    
    const exportData = data.map(point => ({
      timestamp: new Date(point.timestamp).toISOString(),
      time: new Date(point.timestamp).toLocaleString(),
      acc_x: point.x.toFixed(4),
      acc_y: point.y.toFixed(4),
      acc_z: point.z.toFixed(4),
      acc_magnitude: point.magnitude.toFixed(4)
    }));
    
    exportToCSV(exportData, `acelerometro_historico_${Date.now()}`);
    
    toast({
      title: "Exportación exitosa",
      description: `${data.length} registros exportados a CSV`
    });
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Acelerómetro</h3>
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
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 10 }}
            label={{ value: 'Aceleración (m/s²)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="x" 
            stroke="hsl(var(--industrial-cyan))" 
            strokeWidth={1.5}
            dot={false}
            name="Eje X"
          />
          <Line 
            type="monotone" 
            dataKey="y" 
            stroke="hsl(var(--industrial-yellow))" 
            strokeWidth={1.5}
            dot={false}
            name="Eje Y"
          />
          <Line 
            type="monotone" 
            dataKey="z" 
            stroke="hsl(142 71% 45%)" 
            strokeWidth={1.5}
            dot={false}
            name="Eje Z"
          />
          <Line 
            type="monotone" 
            dataKey="magnitud" 
            stroke="hsl(var(--destructive))" 
            strokeWidth={3}
            dot={false}
            name="Magnitud"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
