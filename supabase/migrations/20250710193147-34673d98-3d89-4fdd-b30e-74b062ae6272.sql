-- Create storage buckets for multimedia file sharing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('message-files', 'message-files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT DO NOTHING;

-- Create storage policies for message files
CREATE POLICY "Authenticated users can upload message files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view message files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-files'
  );

CREATE POLICY "Users can update their own message files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'message-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own message files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'message-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );