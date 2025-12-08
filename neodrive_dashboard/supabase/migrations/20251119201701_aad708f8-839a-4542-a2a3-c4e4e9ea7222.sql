-- Create driver_locations table for GPS tracking
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to view locations
CREATE POLICY "Allow public read access to driver locations"
  ON public.driver_locations
  FOR SELECT
  USING (true);

-- Allow public insert for location updates from devices
CREATE POLICY "Allow public insert of driver locations"
  ON public.driver_locations
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries on timestamp
CREATE INDEX idx_driver_locations_timestamp ON public.driver_locations(timestamp DESC);

-- Enable realtime
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;