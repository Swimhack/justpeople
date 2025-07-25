import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const dailyApiKey = Deno.env.get('DAILY_CO_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Video room function called ===');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    // Check if Daily.co API key exists
    if (!dailyApiKey) {
      console.error('DAILY_CO_API_KEY environment variable not set');
      throw new Error('Daily.co API key not configured. Please set DAILY_CO_API_KEY in Supabase secrets.');
    }
    
    console.log('Daily.co API key found, length:', dailyApiKey.length);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { messageId, roomName, action } = body;
    console.log('Request params:', { messageId, roomName, action });
    
    // Validate action
    if (!action || !['create', 'join'].includes(action)) {
      throw new Error('Invalid action. Must be "create" or "join"');
    }
    
    // Validate and sanitize room name format if provided
    if (roomName) {
      const sanitizedRoomName = roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (sanitizedRoomName.length === 0 || sanitizedRoomName.length > 50) {
        throw new Error('Room name must be 1-50 characters after sanitization');
      }
      console.log('Room name sanitized:', roomName, '->', sanitizedRoomName);
    }

    if (action === 'create') {
      // Handle both message-based and standalone room creation
      let finalRoomName;
      
      if (messageId) {
        // Message-based room creation
        console.log('Creating room for message:', messageId);
        
        // Create a new Daily.co room
        const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dailyApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              max_participants: 3,
              enable_screenshare: false,
              enable_chat: false,
              enable_knocking: false,
              exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60), // 4 hours
            }
          }),
        });

        if (!roomResponse.ok) {
          const errorText = await roomResponse.text();
          console.error('Daily.co room creation failed:', {
            status: roomResponse.status,
            statusText: roomResponse.statusText,
            error: errorText,
            dailyKeyExists: !!dailyApiKey,
            dailyKeyLength: dailyApiKey?.length
          });
          
          // Handle specific Daily.co errors
          if (roomResponse.status === 401) {
            throw new Error('Daily.co API key is invalid or expired. Please check your DAILY_CO_API_KEY secret.');
          } else if (roomResponse.status === 409) {
            throw new Error('Room name already exists. Please try a different name.');
          } else if (roomResponse.status === 400) {
            throw new Error(`Invalid room configuration: ${errorText}`);
          } else {
            throw new Error(`Failed to create Daily.co room (${roomResponse.status}): ${errorText}`);
          }
        }

        const roomData = await roomResponse.json();
        finalRoomName = roomData.name;

        // Update the message with the video room ID
        const { error: updateError } = await supabase
          .from('messages')
          .update({ video_room_id: finalRoomName })
          .eq('id', messageId)
          .eq('sender_id', user.id); // Only sender can add video room

        if (updateError) {
          console.error('Message update failed:', updateError);
          throw new Error(`Failed to update message: ${updateError.message}`);
        }
      } else if (roomName) {
        // Standalone room creation with custom name
        console.log('Creating standalone room:', roomName);
        
        const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dailyApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            properties: {
              max_participants: 3,
              enable_screenshare: false,
              enable_chat: false,
              enable_knocking: false,
              exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60), // 4 hours
            }
          }),
        });

        if (!roomResponse.ok) {
          const errorText = await roomResponse.text();
          console.error('Daily.co standalone room creation failed:', {
            status: roomResponse.status,
            statusText: roomResponse.statusText,
            error: errorText,
            roomName: roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          });
          
          // Handle specific Daily.co errors
          if (roomResponse.status === 401) {
            throw new Error('Daily.co API key is invalid or expired. Please check your DAILY_CO_API_KEY secret.');
          } else if (roomResponse.status === 409) {
            throw new Error('Room name already exists. Please try a different name.');
          } else if (roomResponse.status === 400) {
            throw new Error(`Invalid room configuration: ${errorText}`);
          } else {
            throw new Error(`Failed to create Daily.co room (${roomResponse.status}): ${errorText}`);
          }
        }

        const roomData = await roomResponse.json();
        finalRoomName = roomData.name;
      } else {
        throw new Error('Either messageId or roomName must be provided for creation');
      }

      // Create meeting token for the user
      const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dailyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            room_name: finalRoomName,
            user_name: user.email || 'User',
            is_owner: true,
          }
        }),
      });

      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.text();
        console.error('Token creation failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: tokenError,
          roomName: finalRoomName
        });
        
        // Handle specific token creation errors
        if (tokenResponse.status === 401) {
          throw new Error('Daily.co API key is invalid for token creation');
        } else if (tokenResponse.status === 404) {
          throw new Error(`Room ${finalRoomName} not found. It may have expired.`);
        } else {
          throw new Error(`Failed to create meeting token (${tokenResponse.status}): ${tokenError}`);
        }
      }

      const tokenData = await tokenResponse.json();
      console.log('Room created successfully:', finalRoomName);

      return new Response(JSON.stringify({
        roomName: finalRoomName,
        token: tokenData.token,
        url: `https://${finalRoomName}.daily.co`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'join') {
      // Handle both message-based and standalone room joining
      let targetRoomName;
      
      if (messageId) {
        // Message-based room joining
        console.log('Joining room via message:', messageId);
        
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .select('video_room_id, sender_id, recipient_id')
          .eq('id', messageId)
          .single();

        if (messageError || !message) {
          console.error('Message not found:', messageError);
          throw new Error('Message not found');
        }

        // Check if user is authorized to join (sender or recipient)
        if (message.sender_id !== user.id && message.recipient_id !== user.id) {
          throw new Error('Not authorized to join this call');
        }

        if (!message.video_room_id) {
          throw new Error('No video room associated with this message');
        }

        targetRoomName = message.video_room_id;
      } else if (roomName) {
        // Standalone room joining
        console.log('Joining standalone room:', roomName);
        targetRoomName = roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      } else {
        throw new Error('Either messageId or roomName must be provided for joining');
      }

      // Create meeting token for joining user
      const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dailyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            room_name: targetRoomName,
            user_name: user.email || 'User',
            is_owner: false,
          }
        }),
      });

      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.text();
        console.error('Join token creation failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: tokenError,
          roomName: targetRoomName
        });
        
        // Handle specific token creation errors for joining
        if (tokenResponse.status === 401) {
          throw new Error('Daily.co API key is invalid for token creation');
        } else if (tokenResponse.status === 404) {
          throw new Error(`Room "${targetRoomName}" not found. Please check the room name or create a new room.`);
        } else {
          throw new Error(`Failed to create meeting token (${tokenResponse.status}): ${tokenError}`);
        }
      }

      const tokenData = await tokenResponse.json();
      console.log('Joining room successfully:', targetRoomName);

      return new Response(JSON.stringify({
        roomName: targetRoomName,
        token: tokenData.token,
        url: `https://${targetRoomName}.daily.co`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in create-video-room function:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Log to application_logs for debugging
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.functions.invoke('application-logs', {
        body: {
          level: 'error',
          message: `Video room error: ${error.message}`,
          source: 'create-video-room',
          metadata: {
            errorName: error.name,
            stack: error.stack
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});