import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Navigation, Radio, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

const fatigueQuestions = [
  "Me molesta la fatiga (WHOQOL)",
  "Me canso muy rápido (CIS)",
  "No hago mucho durante el día (CIS)",
  "Tengo suficiente energía para la vida cotidiana (WHOQOL)",
  "Físicamente, me siento agotado(a) (CIS)",
  "Tengo problemas para comenzar cosas (FS)",
  "Tengo problemas para pensar con claridad (FS)",
  "No siento deseos de hacer nada (CIS)",
  "Mentalmente, me siento agotado(a)",
  "Cuando estoy haciendo algo, puedo concentrarme bastante bien (CIS)"
];

const scaleLabels = [
  { value: "1", label: "Nunca" },
  { value: "2", label: "A veces" },
  { value: "3", label: "Regularmente" },
  { value: "4", label: "A menudo" },
  { value: "5", label: "Siempre" }
];

const LocationTest = () => {
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const calculateFatigueLevel = () => {
    const totalScore = Object.values(answers).reduce((sum, val) => sum + parseInt(val), 0);
    const maxScore = fatigueQuestions.length * 5;
    return (totalScore / maxScore) * 100;
  };

  const handleSubmitSurvey = () => {
    if (Object.keys(answers).length !== fatigueQuestions.length) {
      toast.error('Por favor responde todas las preguntas');
      return;
    }
    
    const level = calculateFatigueLevel();
    console.log('Fatigue survey level calculated:', level);
    setFatigueLevel(level);
    setSurveyCompleted(true);
    
    // Guardar en localStorage para mostrarlo en el dashboard
    localStorage.setItem('fatigueLevel', level.toString());
    localStorage.setItem('fatigueTimestamp', new Date().toISOString());
    
    // Disparar evento personalizado para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('fatigueUpdated', { 
      detail: { level } 
    }));
    
    toast.success('Encuesta completada');
  };

  const sendLocation = async (position: GeolocationPosition) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/location-update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send location');
      }

      console.log('Location sent successfully');
    } catch (err) {
      console.error('Error sending location:', err);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      toast.error('Geolocation not supported');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position);
        setError(null);
        sendLocation(position);
      },
      (err) => {
        setError(err.message);
        toast.error(`Location error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    setWatchId(id);
    setIsTracking(true);
    toast.success('Location tracking started');
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
      toast.info('Location tracking stopped');
    }
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const getFatigueStatus = (level: number): { status: 'OK' | 'FATIGA' | 'CRÍTICO', color: string } => {
    if (level > 70) return { status: 'CRÍTICO', color: 'text-status-critical' };
    if (level > 50) return { status: 'FATIGA', color: 'text-status-warning' };
    return { status: 'OK', color: 'text-status-ok' };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Evaluación de Operador</h1>
            <p className="text-muted-foreground">Completa la encuesta y activa el seguimiento GPS</p>
          </div>
        </div>

        {!surveyCompleted ? (
          <Card>
            <CardHeader>
              <CardTitle>Evaluación de Fatiga</CardTitle>
              <CardDescription>
                Responde cada pregunta usando la siguiente escala: 1=Nunca, 2=A veces, 3=Regularmente, 4=A menudo, 5=Siempre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fatigueQuestions.map((question, index) => (
                <div key={index} className="space-y-3 pb-4 border-b border-border last:border-b-0">
                  <Label className="text-base font-medium">{index + 1}. {question}</Label>
                  <RadioGroup
                    value={answers[index]}
                    onValueChange={(value) => handleAnswerChange(index, value)}
                  >
                    <div className="flex gap-4 flex-wrap">
                      {scaleLabels.map((scale) => (
                        <div key={scale.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={scale.value} id={`q${index}-${scale.value}`} />
                          <Label htmlFor={`q${index}-${scale.value}`} className="cursor-pointer">
                            {scale.value} - {scale.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              ))}
              
              <Button 
                onClick={handleSubmitSurvey} 
                className="w-full"
                disabled={Object.keys(answers).length !== fatigueQuestions.length}
              >
                Completar Encuesta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Nivel de Fatiga</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-foreground">{fatigueLevel.toFixed(1)}%</span>
                    <span className={`text-xl font-bold ${getFatigueStatus(fatigueLevel).color}`}>
                      {getFatigueStatus(fatigueLevel).status}
                    </span>
                  </div>
                  
                  <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                        fatigueLevel > 70 ? 'bg-status-critical' :
                        fatigueLevel > 50 ? 'bg-status-warning' :
                        'bg-status-ok'
                      }`}
                      style={{ width: `${fatigueLevel}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="text-status-warning">50%</span>
                    <span className="text-status-critical">70%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Seguimiento GPS
                </CardTitle>
                <CardDescription>
                  Activa el seguimiento de ubicación para enviar tus coordenadas GPS al dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={startTracking}
                    disabled={isTracking}
                    className="flex-1"
                  >
                    Iniciar Seguimiento
                  </Button>
                  <Button
                    onClick={stopTracking}
                    disabled={!isTracking}
                    variant="outline"
                    className="flex-1"
                  >
                    Detener Seguimiento
                  </Button>
                </div>

                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                    {error}
                  </div>
                )}

                {isTracking && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Radio className="h-4 w-4 animate-pulse" />
                    Seguimiento activo
                  </div>
                )}
              </CardContent>
            </Card>

            {location && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Ubicación Actual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latitud:</span>
                    <span className="font-mono">{location.coords.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longitud:</span>
                    <span className="font-mono">{location.coords.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precisión:</span>
                    <span className="font-mono">{location.coords.accuracy.toFixed(1)} m</span>
                  </div>
                  {location.coords.speed !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Velocidad:</span>
                      <span className="font-mono">
                        {(location.coords.speed * 3.6).toFixed(1)} km/h
                      </span>
                    </div>
                  )}
                  {location.coords.heading !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rumbo:</span>
                      <span className="font-mono">{location.coords.heading.toFixed(0)}°</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última Actualización:</span>
                    <span className="font-mono">
                      {new Date(location.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LocationTest;
