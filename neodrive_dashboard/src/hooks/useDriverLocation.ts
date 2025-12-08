import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DriverLocation {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  created_at: string;
}

export const useDriverLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<DriverLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<DriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial location and history
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Get the most recent location
        const { data: latest, error: latestError } = await supabase
          .from('driver_locations')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestError) throw latestError;
        if (latest) {
          setCurrentLocation(latest);
        }

        // Get location history (last 50 points)
        const { data: history, error: historyError } = await supabase
          .from('driver_locations')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (historyError) throw historyError;
        if (history) {
          setLocationHistory(history);
        }
      } catch (error) {
        console.error('Error fetching driver locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Subscribe to real-time location updates
  useEffect(() => {
    const channel = supabase
      .channel('driver-locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_locations',
        },
        (payload) => {
          const newLocation = payload.new as DriverLocation;
          console.log('New location received:', newLocation);
          setCurrentLocation(newLocation);
          setLocationHistory((prev) => [newLocation, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { currentLocation, locationHistory, isLoading };
};
