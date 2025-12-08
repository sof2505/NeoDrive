import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PIDPanelProps {
  setpoint: number;
  output: number;
  measured: number;
}

export const PIDPanel = ({ setpoint, output, measured }: PIDPanelProps) => {
  const data = [
    { name: 'Setpoint', value: setpoint },
    { name: 'Salida PWM', value: output },
    { name: 'Fuerza Medida', value: measured },
  ];

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Control PID - Biofeedback</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Setpoint</p>
          <p className="text-xl font-bold text-primary">{setpoint.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Salida PWM</p>
          <p className="text-xl font-bold text-industrial-cyan">{output.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Fuerza Medida</p>
          <p className="text-xl font-bold text-industrial-orange">{measured.toFixed(1)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
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
          <Legend />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
