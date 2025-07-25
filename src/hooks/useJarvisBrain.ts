import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JarvisRequest {
  message: string;
  provider?: 'openai' | 'claude';
  context_keys?: string[];
  memory_search?: boolean;
}

interface JarvisResponse {
  response: string;
  metadata: {
    provider: string;
    processing_time_ms: number;
    tokens_used: number;
    memories_used: number;
    context_used: number;
    timestamp: string;
  };
  context_summary: {
    memories: Array<{ type: string; relevance: number }>;
    context_keys: string[];
  };
}

export const useJarvisBrain = () => {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<JarvisResponse | null>(null);
  const { toast } = useToast();

  const askJarvis = async ({ 
    message, 
    provider = 'openai', 
    context_keys = [], 
    memory_search = true 
  }: JarvisRequest): Promise<JarvisResponse | null> => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message to send to Jarvis.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('jarvis-brain', {
        body: {
          message,
          provider,
          context_keys,
          memory_search,
          user_id: user.user?.id
        },
      });

      if (error) {
        throw error;
      }

      setLastResponse(data);
      return data;

    } catch (error) {
      console.error('Error calling Jarvis brain:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from Jarvis. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const storeMemory = async (content: string, memoryType = 'general', sourceType = 'user') => {
    try {
      const { data, error } = await supabase.functions.invoke('memory-processor', {
        body: {
          content,
          memory_type: memoryType,
          source_type: sourceType,
          relevance_score: 0.7
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Memory stored successfully.',
      });

      return data;
    } catch (error) {
      console.error('Error storing memory:', error);
      toast({
        title: 'Error',
        description: 'Failed to store memory.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const storeContext = async (contextKey: string, contextData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('memory-processor', {
        body: {
          context_key: contextKey,
          context_data: contextData
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Context stored successfully.',
      });

      return data;
    } catch (error) {
      console.error('Error storing context:', error);
      toast({
        title: 'Error',
        description: 'Failed to store context.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    askJarvis,
    storeMemory,
    storeContext,
    loading,
    lastResponse
  };
};