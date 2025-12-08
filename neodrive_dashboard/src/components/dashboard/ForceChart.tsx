import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ForceDataPoint } from "@/hooks/useRealtimeData";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/exportToCSV";
import { useToast } from "@/hooks/use-toast";

interface ForceChartProps {
  data: ForceDataPoint[];
}

export const ForceChart = ({ data }: ForceChartProps) => {
  const { toast } = useToast();
  
  const chartData = data.map(point => ({
    time: new Date(point.time).toLocaleTimeString(),
    timestamp: new Date(point.time).toISOString(),
    force: parseFloat(point.force.toFixed(1)),
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
      timestamp: new Date(point.time).toISOString(),
      time: new Date(point.time).toLocaleString(),
      force: point.force.toFixed(2)
    }));
    
    exportToCSV(exportData, `fuerza_historico_${Date.now()}`);
    
    toast({
      title: "Exportación exitosa",
      description: `${data.length} registros exportados a CSV`
    });
  };

  const yAxisDomain = [0, 100]; // Fixed domain for percentage scale

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Fuerza vs Tiempo</h3>
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
            domain={yAxisDomain}
            label={{ value: 'Fuerza (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Fuerza']}
          />
          <Line 
            type="monotone" 
            dataKey="force" 
            stroke="hsl(var(--industrial-cyan))" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
