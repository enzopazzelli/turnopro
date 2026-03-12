-- ============================================
-- 008_storage_perfiles.sql
-- Bucket publico para avatares y hero images
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('perfiles', 'perfiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Lectura publica (las imagenes de perfil son publicas)
CREATE POLICY "public_read_perfiles" ON storage.objects FOR SELECT
  USING (bucket_id = 'perfiles');

-- Upload por tenant (carpeta = tenant_id)
CREATE POLICY "tenant_upload_perfiles" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'perfiles' AND (storage.foldername(name))[1] = public.get_tenant_id_for_user()::text);

-- Delete por tenant
CREATE POLICY "tenant_delete_perfiles" ON storage.objects FOR DELETE
  USING (bucket_id = 'perfiles' AND (storage.foldername(name))[1] = public.get_tenant_id_for_user()::text);

-- Update por tenant (para upsert)
CREATE POLICY "tenant_update_perfiles" ON storage.objects FOR UPDATE
  USING (bucket_id = 'perfiles' AND (storage.foldername(name))[1] = public.get_tenant_id_for_user()::text);
