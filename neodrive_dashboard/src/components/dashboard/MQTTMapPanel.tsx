import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMQTTLocation } from "@/hooks/useMQTTLocation";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

const MQTTMapPanel = () => {
  const { location, isConnected, error } = useMQTTLocation();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Conductor (Sensor GPS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Conductor (Sensor GPS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Conductor (Sensor GPS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Conectando a MQTT...</p>
        </CardContent>
      </Card>
    );
  }

  if (!location.latitude || !location.longitude) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Conductor (Sensor GPS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] gap-4">
            <div className="animate-pulse flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-sm text-muted-foreground">
              Esperando coordenadas GPS...
            </p>
            <p className="text-xs text-muted-foreground">
              Tópicos: RoboCaroLogic/lat, RoboCaroLogic/lon
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const center = {
    lat: location.latitude,
    lng: location.longitude,
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicación de Conductor (Sensor GPS)
        </CardTitle>
        {location.lastUpdate && (
          <div className="text-sm text-muted-foreground flex items-center gap-4">
            <span>Lat: {location.latitude.toFixed(6)}</span>
            <span>Lon: {location.longitude.toFixed(6)}</span>
            <span className="text-xs">
              Actualizado: {location.lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 w-full rounded-b-lg overflow-hidden">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={center}
              center={center}
              defaultZoom={15}
              mapId="mqtt-gps-map"
              disableDefaultUI={false}
            >
              <AdvancedMarker position={center}>
                <Pin
                  background={"#22c55e"}
                  borderColor={"#15803d"}
                  glyphColor={"#ffffff"}
                />
              </AdvancedMarker>
            </Map>
          </APIProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default MQTTMapPanel;
