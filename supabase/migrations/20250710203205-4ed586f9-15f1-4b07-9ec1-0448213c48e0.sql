-- Enable realtime for production-ready messaging system (checking existing setup)
-- Based on Supabase official documentation and best practices

-- Add only tables not already in realtime publication
DO $$
BEGIN
    -- Check and add message_reactions if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
    END IF;

    -- Check and add typing_indicators if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'typing_indicators'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
    END IF;

    -- Check and add user_presence if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'user_presence'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
    END IF;

    -- Check and add contacts if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'contacts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
    END IF;
END $$;

-- Set replica identity to FULL for complete row data during updates
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE message_reactions REPLICA IDENTITY FULL;
ALTER TABLE typing_indicators REPLICA IDENTITY FULL;
ALTER TABLE user_presence REPLICA IDENTITY FULL;
ALTER TABLE contacts REPLICA IDENTITY FULL;

-- Create optimized indexes for real-time queries
CREATE INDEX IF NOT EXISTS idx_messages_recipient_created 
ON messages(recipient_id, created_at DESC) 
WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
ON messages(sender_id, created_at DESC) 
WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_user 
ON message_reactions(message_id, user_id);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_recipient_updated 
ON typing_indicators(recipient_id, last_updated DESC) 
WHERE is_typing = true;

CREATE INDEX IF NOT EXISTS idx_user_presence_status_updated 
ON user_presence(status, updated_at DESC);

-- Create function to automatically clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE last_updated < now() - interval '5 minutes';
END;
$$;

-- Create function to update user presence on activity
CREATE OR REPLACE FUNCTION update_user_presence(user_uuid uuid, new_status text DEFAULT 'online')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, updated_at, last_seen)
  VALUES (user_uuid, new_status, now(), now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at,
    last_seen = EXCLUDED.last_seen;
END;
$$;

-- Create function to handle message read status updates
CREATE OR REPLACE FUNCTION mark_message_read(message_uuid uuid, reader_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages 
  SET is_read = true, updated_at = now()
  WHERE id = message_uuid 
    AND (recipient_id = reader_uuid OR sender_id = reader_uuid)
    AND is_read = false;
  
  RETURN FOUND;
END;
$$;

-- Performance optimization: Partial indexes for active data
CREATE INDEX IF NOT EXISTS idx_messages_active_broadcast 
ON messages(created_at DESC) 
WHERE recipient_id IS NULL AND is_archived = false;

CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(recipient_id, created_at DESC) 
WHERE is_read = false AND is_archived = false;

-- Add comment for production readiness
COMMENT ON TABLE messages IS 'Production-ready messaging table with realtime enabled';
COMMENT ON TABLE message_reactions IS 'Production-ready message reactions with realtime enabled';
COMMENT ON TABLE typing_indicators IS 'Production-ready typing indicators with realtime enabled';
COMMENT ON TABLE user_presence IS 'Production-ready user presence with realtime enabled';