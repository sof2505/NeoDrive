import { useState, useEffect } from "react";
import { Activity, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { useAccelerometer } from "@/hooks/useAccelerometer";
import { FatigueGauge } from "@/components/dashboard/FatigueGauge";
import { ForceChart } from "@/components/dashboard/ForceChart";
import { AccelerometerChart } from "@/components/dashboard/AccelerometerChart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TremorPanel } from "@/components/dashboard/TremorPanel";
import { TemperaturePanel } from "@/components/dashboard/TemperaturePanel";
import { PIDPanel } from "@/components/dashboard/PIDPanel";
import { EventsPanel } from "@/components/dashboard/EventsPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import MapPanel from "@/components/dashboard/MapPanel";
import MQTTMapPanel from "@/components/dashboard/MQTTMapPanel";

const Index = () => {
  const { data, forceHistory, tremorSpectrum } = useRealtimeData();
  const { history: accelerometerHistory } = useAccelerometer();
  const [fatigueLevel, setFatigueLevel] = useState<number | null>(null);

  useEffect(() => {
    // Leer el nivel de fatiga de localStorage al cargar
    const loadFatigueLevel = () => {
      const storedLevel = localStorage.getItem('fatigueLevel');
      console.log('Dashboard loaded fatigue level from localStorage:', storedLevel);

      if (storedLevel) {
        const parsed = parseFloat(storedLevel);
        console.log('Parsed fatigue level:', parsed);
        setFatigueLevel(parsed);
      }
    };

    loadFatigueLevel();

    // Escuchar el evento personalizado cuando se actualiza la fatiga
    const handleFatigueUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Fatigue update event received:', customEvent.detail);
      if (customEvent.detail && customEvent.detail.level !== undefined) {
        setFatigueLevel(customEvent.detail.level);
      }
    };

    // Escuchar cambios en localStorage desde otras pestañas
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'fatigueLevel' && event.newValue) {
        console.log('Storage event received from another tab:', event.newValue);
        setFatigueLevel(parseFloat(event.newValue));
      }
    };

    window.addEventListener('fatigueUpdated', handleFatigueUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('fatigueUpdated', handleFatigueUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Neodrive</h1>
              <p className="text-muted-foreground">Monitoreo en tiempo real del estado fisiológico del operador</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/start">
              <Button variant="outline" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Evaluación de Fatiga
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Operator Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Force Chart */}
          <ForceChart data={forceHistory} />

          {/* Accelerometer Chart */}
          <AccelerometerChart data={accelerometerHistory} />

          {/* Force Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="%MVC"
              value={data.mvc}
              unit="%"
              color={data.mvc > 70 ? 'warning' : 'default'}
            />
            <MetricCard
              label="CoV"
              value={data.cov}
              unit="%"
              color={data.cov > 20 ? 'warning' : 'default'}
            />
            <MetricCard
              label="RFD"
              value={data.rfd}
              unit="N/s"
            />
          </div>

          {/* Tremor Panel */}
          <TremorPanel 
            spectrum={tremorSpectrum}
            power={data.tremorPower}
            frequency={data.tremorFreq}
          />

          {/* Temperature Panel */}
          <TemperaturePanel
            temperature={data.temperature}
            tempRate={data.tempRate}
            thermalEnergy={data.thermalEnergy}
          />

          {/* Force Display */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Fuerza"
              value={data.force}
              unit="%"
              color={data.force > 80 ? 'critical' : data.force > 60 ? 'warning' : 'ok'}
            />
            <MetricCard
              label="Fuerza (PID)"
              value={data.pidOutput}
              unit="%"
            />
          </div>
        </div>

        {/* Right Column - Status & Controls */}
        <div className="space-y-6">
          {/* Fatigue Gauge */}
          <FatigueGauge 
            value={fatigueLevel ?? data.fatigueIndex}
            status={
              fatigueLevel === null 
                ? data.fatigueStatus
                : fatigueLevel > 70 
                  ? 'CRÍTICO'
                  : fatigueLevel > 50 
                    ? 'FATIGA' 
                    : 'OK'
            }
          />

          {/* Status Info Card */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Estado del Sistema</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conexión MQTT:</span>
                <span className="text-status-ok font-medium">Activo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PID:</span>
                <span className="text-status-ok font-medium">Habilitado</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SSR:</span>
                <span className="text-status-ok font-medium">Normal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última calibración:</span>
                <span className="text-foreground">14:15:33</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GPS Maps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MapPanel />
        <MQTTMapPanel />
      </div>

      {/* Events */}
      <EventsPanel />
    </div>
  );
};

export default Index;
