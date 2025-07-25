-- Add video room support to messages table
ALTER TABLE public.messages 
ADD COLUMN video_room_id TEXT;

-- Create index for better performance on video room queries
CREATE INDEX idx_messages_video_room_id ON public.messages(video_room_id) WHERE video_room_id IS NOT NULL;