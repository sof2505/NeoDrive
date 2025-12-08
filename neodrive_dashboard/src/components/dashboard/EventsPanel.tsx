import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Event {
  id: string;
  timestamp: string;
  operator: string;
  event: string;
  level: 'OK' | 'FATIGA' | 'CRÍTICO';
}

const mockEvents: Event[] = [
  { id: '1', timestamp: '2025-01-15 14:23:15', operator: 'Operador A', event: 'Nivel de fatiga CRÍTICO detectado', level: 'CRÍTICO' },
  { id: '2', timestamp: '2025-01-15 14:18:42', operator: 'Operador A', event: 'Temperatura elevada', level: 'FATIGA' },
  { id: '3', timestamp: '2025-01-15 14:10:33', operator: 'Operador A', event: 'Sistema calibrado correctamente', level: 'OK' },
  { id: '4', timestamp: '2025-01-15 13:55:21', operator: 'Operador B', event: 'Inicio de turno', level: 'OK' },
  { id: '5', timestamp: '2025-01-15 13:45:10', operator: 'Operador B', event: 'Temblor excesivo detectado', level: 'FATIGA' },
];

export const EventsPanel = () => {
  const [events] = useState<Event[]>(mockEvents);
  const [filter, setFilter] = useState('');

  const filteredEvents = events.filter(e => 
    e.operator.toLowerCase().includes(filter.toLowerCase()) ||
    e.event.toLowerCase().includes(filter.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Operador', 'Evento', 'Nivel'].join(','),
      ...events.map(e => [e.timestamp, e.operator, e.event, e.level].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eventos_fatiga.csv';
    a.click();
    
    toast.success("Eventos exportados a CSV");
  };

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'CRÍTICO': return 'text-status-critical';
      case 'FATIGA': return 'text-status-warning';
      default: return 'text-status-ok';
    }
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Eventos / Histórico</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar eventos..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Timestamp</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Nivel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-mono text-xs">{event.timestamp}</TableCell>
                <TableCell>{event.operator}</TableCell>
                <TableCell>{event.event}</TableCell>
                <TableCell>
                  <span className={`font-bold ${getLevelColor(event.level)}`}>
                    {event.level}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
