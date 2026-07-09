-- Allow voice notes in chat attachments
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_attachment_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_attachment_type_check
  CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'video', 'audio'));
