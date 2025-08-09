-- Create storage buckets for SVG files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('desk-decor', 'desk-decor', true),
  ('desk-monitors', 'desk-monitors', true),
  ('desk-screens', 'desk-screens', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for admin access
CREATE POLICY "Admin can upload SVGs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('desk-decor', 'desk-monitors', 'desk-screens'));

CREATE POLICY "Anyone can view SVGs" ON storage.objects
  FOR SELECT USING (bucket_id IN ('desk-decor', 'desk-monitors', 'desk-screens'));
