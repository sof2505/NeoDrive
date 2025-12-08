import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useDriverLocation } from '@/hooks/useDriverLocation';

const MapPanel = () => {
  const { currentLocation, locationHistory, isLoading } = useDriverLocation();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Conductor (GPS Smartphone)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Google Maps API key not configured
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Conductor (GPS Smartphone)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading location data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentLocation) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Conductor (GPS Smartphone)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No location data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const center = {
    lat: currentLocation.latitude,
    lng: currentLocation.longitude,
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicación de Conductor (GPS Smartphone)
        </CardTitle>
        {currentLocation && (
          <div className="text-sm text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </span>
            {currentLocation.speed && (
              <span>{(currentLocation.speed * 3.6).toFixed(1)} km/h</span>
            )}
            <span className="text-xs">
              {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 w-full rounded-b-lg overflow-hidden">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultZoom={15}
              defaultCenter={center}
              center={center}
              mapId="driver-location-map"
              gestureHandling="greedy"
              disableDefaultUI={false}
              zoomControl={true}
              mapTypeControl={false}
              streetViewControl={false}
            >
              {/* Current location marker */}
              <AdvancedMarker
                position={center}
                title="Current Location"
              />

              {/* Path history markers */}
              {locationHistory.slice(1).map((loc, idx) => (
                <AdvancedMarker
                  key={loc.id}
                  position={{ lat: loc.latitude, lng: loc.longitude }}
                  title={`Position ${idx + 1}`}
                />
              ))}
            </Map>
          </APIProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPanel;
