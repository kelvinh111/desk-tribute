-- Create storage buckets for admin SVG uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('desk-decor', 'desk-decor', true, 5242880, '{"image/svg+xml"}'),
  ('desk-monitors', 'desk-monitors', true, 5242880, '{"image/svg+xml"}'),
  ('desk-screens', 'desk-screens', true, 5242880, '{"image/svg+xml"}')
on conflict (id) do nothing;

-- Create storage policies
create policy "Anyone can view SVG files"
on storage.objects for select
using ( bucket_id in ('desk-decor', 'desk-monitors', 'desk-screens') );

create policy "Authenticated users can upload SVG files"
on storage.objects for insert
with check ( bucket_id in ('desk-decor', 'desk-monitors', 'desk-screens') and auth.role() = 'authenticated' );

create policy "Authenticated users can update SVG files"
on storage.objects for update
using ( bucket_id in ('desk-decor', 'desk-monitors', 'desk-screens') and auth.role() = 'authenticated' );

create policy "Authenticated users can delete SVG files"
on storage.objects for delete
using ( bucket_id in ('desk-decor', 'desk-monitors', 'desk-screens') and auth.role() = 'authenticated' );
