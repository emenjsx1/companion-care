-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view active gallery images
CREATE POLICY "Anyone can view active gallery images" ON public.gallery_images
  FOR SELECT USING (is_active = true OR is_admin());

-- Admins can manage gallery images
CREATE POLICY "Admins can manage gallery images" ON public.gallery_images
  FOR ALL USING (is_admin());

-- Create storage bucket for gallery
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gallery' AND is_admin());

CREATE POLICY "Admins can update gallery images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gallery' AND is_admin());

CREATE POLICY "Admins can delete gallery images"
ON storage.objects FOR DELETE
USING (bucket_id = 'gallery' AND is_admin());

-- Create updated_at trigger for gallery_images
CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial courses (Motociclos, Ligeiros, Pesados)
INSERT INTO public.courses (name, category, price, duration_hours, description, is_active)
VALUES 
  ('Motociclos - Categoria A', 'A', 5000, 20, 'Carta para condução de motociclos de qualquer cilindrada', true),
  ('Ligeiros - Categoria B', 'B', 10000, 30, 'Veículos ligeiros até 3500kg e 9 lugares', true),
  ('Pesados Mercadorias - Categoria C', 'C', 15000, 40, 'Veículos pesados de mercadorias acima de 3500kg', true)
ON CONFLICT DO NOTHING;