-- Add service_center column to daily_payments table
ALTER TABLE public.daily_payments 
ADD COLUMN service_center text;

-- Create service_centers table with major Ugandan cities and towns
CREATE TABLE IF NOT EXISTS public.service_centers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  district text,
  region text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on service_centers
ALTER TABLE public.service_centers ENABLE ROW LEVEL SECURITY;

-- Create policies for service_centers
CREATE POLICY "Anyone can view active service centers"
  ON public.service_centers
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view all service centers"
  ON public.service_centers
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert service centers"
  ON public.service_centers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update service centers"
  ON public.service_centers
  FOR UPDATE
  USING (true);

-- Insert major Ugandan cities and towns as service centers
INSERT INTO public.service_centers (name, district, region) VALUES
  -- Central Region
  ('Kampala', 'Kampala', 'Central'),
  ('Entebbe', 'Wakiso', 'Central'),
  ('Mukono', 'Mukono', 'Central'),
  ('Wakiso', 'Wakiso', 'Central'),
  ('Mpigi', 'Mpigi', 'Central'),
  ('Mityana', 'Mityana', 'Central'),
  ('Mubende', 'Mubende', 'Central'),
  ('Masaka', 'Masaka', 'Central'),
  ('Luweero', 'Luweero', 'Central'),
  ('Nakasongola', 'Nakasongola', 'Central'),
  
  -- Eastern Region
  ('Jinja', 'Jinja', 'Eastern'),
  ('Mbale', 'Mbale', 'Eastern'),
  ('Soroti', 'Soroti', 'Eastern'),
  ('Tororo', 'Tororo', 'Eastern'),
  ('Iganga', 'Iganga', 'Eastern'),
  ('Busia', 'Busia', 'Eastern'),
  ('Pallisa', 'Pallisa', 'Eastern'),
  ('Kamuli', 'Kamuli', 'Eastern'),
  ('Bugiri', 'Bugiri', 'Eastern'),
  ('Mayuge', 'Mayuge', 'Eastern'),
  
  -- Northern Region
  ('Gulu', 'Gulu', 'Northern'),
  ('Lira', 'Lira', 'Northern'),
  ('Arua', 'Arua', 'Northern'),
  ('Kitgum', 'Kitgum', 'Northern'),
  ('Pader', 'Pader', 'Northern'),
  ('Kotido', 'Kotido', 'Northern'),
  ('Moroto', 'Moroto', 'Northern'),
  ('Apac', 'Apac', 'Northern'),
  ('Nebbi', 'Nebbi', 'Northern'),
  ('Adjumani', 'Adjumani', 'Northern'),
  
  -- Western Region
  ('Mbarara', 'Mbarara', 'Western'),
  ('Fort Portal', 'Kabarole', 'Western'),
  ('Kasese', 'Kasese', 'Western'),
  ('Hoima', 'Hoima', 'Western'),
  ('Kabale', 'Kabale', 'Western'),
  ('Bushenyi', 'Bushenyi', 'Western'),
  ('Masindi', 'Masindi', 'Western'),
  ('Rukungiri', 'Rukungiri', 'Western'),
  ('Ntungamo', 'Ntungamo', 'Western'),
  ('Ibanda', 'Ibanda', 'Western');

-- Create trigger for updated_at
CREATE TRIGGER update_service_centers_updated_at
  BEFORE UPDATE ON public.service_centers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();