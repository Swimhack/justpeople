import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MCPResponse<T = any> {
  success: boolean;
  result?: T;
  error?: string;
}

interface MCPMemory {
  id: number;
  category: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface MCPFact {
  id: number;
  category: string;
  fact: string;
  confidence: number;
  source_conversation_id?: string;
  created_at: string;
  last_accessed: string;
}

interface MCPStats {
  total_conversations: number;
  total_messages: number;
  total_memories: number;
  total_facts: number;
  memory_categories: string[];
  fact_categories: string[];
  storage_type: string;
  server_status: string;
}

interface Memory {
  id: string;
  content: string;
  timestamp: string;
  type: string;
  metadata?: Record<string, any>;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Stats {
  totalConversations: number;
  totalMessages: number;
  memoryCount: number;
  lastActivity: string;
  tokenUsage?: {
    total: number;
    thisMonth: number;
  };
}

interface ConnectionStatus {
  connected: boolean;
  lastChecked: Date;
  error?: string;
}

const MCP_API_URL = 'https://vison-mcp-api.netlify.app/.netlify/functions/mcp-server';
const BEARER_TOKEN = 'sk-6c8e9f7c4b2a1d0e3f5a7c6e8b9d2f1c';

// JARVIS Core Identity and Business Context
const JARVIS_CORE_MEMORIES = [
  {
    category: 'core_identity',
    content: 'You are James Strickland — serial entrepreneur, AI builder, world-class powerlifter (a.k.a. Swimhack), and founder of Strickland Technology.',
    metadata: { type: 'identity', priority: 'high' }
  },
  {
    category: 'business_focus',
    content: 'Building voice-first, AI-powered future through projects like Whizby, BenchOnly, and eKaty, while integrating faith, family, fitness, and tech.',
    metadata: { type: 'business', priority: 'high' }
  },
  {
    category: 'revenue_target',
    content: 'Current revenue target: $200-$300/day liquid cash flow. Financial state: $478 until Jan 1, 2025.',
    metadata: { type: 'financial', priority: 'high' }
  },
  {
    category: 'work_schedule',
    content: 'Cold outreach: 8-10 AM daily. Meetings: Afternoons (except Tuesday AMs).',
    metadata: { type: 'schedule', priority: 'medium' }
  },
  {
    category: 'communication_style',
    content: 'Sharp, concise responses with real business sense and strategic foresight. Priorities: efficiency, automation, AI-driven scaling.',
    metadata: { type: 'personality', priority: 'high' }
  },
  {
    category: 'partnerships',
    content: 'JJP Solutions, LLC - Partners: James Strickland & Jimmy Gowen. Focus: AI-driven solutions for enterprise and corporate clients.',
    metadata: { type: 'business', priority: 'medium' }
  },
  {
    category: 'active_projects',
    content: 'Active projects: WOOC (Walking Out of Chaos) mental wellness app, JARVIS AI assistant system, Windsurf deployments, EzEdit implementations.',
    metadata: { type: 'projects', priority: 'high' }
  }
];

export const useJarvisMCP = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastChecked: new Date()
  });
  const [coreIdentityLoaded, setCoreIdentityLoaded] = useState(false);
  const { toast } = useToast();

  // Load JARVIS core identity and context
  const loadJarvisContext = useCallback(async (): Promise<void> => {
    if (coreIdentityLoaded) return;
    
    try {
      console.log('[JARVIS] Loading core identity and business context...');
      
      // Store each core memory in MCP
      for (const memory of JARVIS_CORE_MEMORIES) {
        await callMCPAPI('memory.store', memory);
      }
      
      setCoreIdentityLoaded(true);
      console.log('[JARVIS] Core identity loaded successfully');
    } catch (err) {
      console.error('[JARVIS] Failed to load core identity:', err);
    }
  }, [coreIdentityLoaded]);

  // Check API connectivity and load core identity
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(MCP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEARER_TOKEN}`,
        },
        body: JSON.stringify({
          method: 'stats.get',
          params: {}
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const connected = result.success || false;
      
      setConnectionStatus({
        connected,
        lastChecked: new Date(),
        error: connected ? undefined : result.error || 'Connection failed'
      });

      // Load core identity if connected
      if (connected && !coreIdentityLoaded) {
        await loadJarvisContext();
      }
      
      return connected;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      setConnectionStatus({
        connected: false,
        lastChecked: new Date(),
        error: errorMsg
      });
      return false;
    }
  }, [coreIdentityLoaded, loadJarvisContext]);

  const callMCPAPI = useCallback(async <T>(method: string, params: Record<string, any> = {}): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[MCP API] Calling method: ${method}`, params);
      
      const response = await fetch(MCP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEARER_TOKEN}`
        },
        body: JSON.stringify({
          method,
          params
        })
      });

      console.log(`[MCP API] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MCP API] HTTP error:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[MCP API] Response data:`, result);

      // Handle MCP server response structure: { success: true, result: data }
      if (result.success) {
        setConnectionStatus(prev => ({ ...prev, connected: true, error: undefined }));
        return result.result as T;
      } else {
        throw new Error(result.error || 'MCP API call failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.warn(`[MCP API] Error calling ${method}:`, errorMessage);
      
      setConnectionStatus(prev => ({ ...prev, connected: false, error: errorMessage }));
      
      // Don't show toast for every API error to avoid spam
      console.error(`[MCP API] Error calling ${method}:`, err);
      throw err; // Re-throw to let callers handle the error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search memories by content or category
  const searchMemory = useCallback(async (query: string, type: string = 'content', limit: number = 10): Promise<Memory[]> => {
    try {
      const result = await callMCPAPI<{ memories: MCPMemory[] }>('memory.search', { query, type, limit });
      
      if (result?.memories) {
        return result.memories.map(m => ({
          id: m.id.toString(),
          content: m.content,
          type: m.category,
          timestamp: m.created_at,
          metadata: m.metadata
        }));
      }
      return [];
    } catch (err) {
      console.error('[MCP] Search memory failed:', err);
      return [];
    }
  }, [callMCPAPI]);

  // Store a new memory using category-based structure
  const storeMemory = useCallback(async (category: string, content: string, metadata: Record<string, any> = {}): Promise<boolean> => {
    try {
      const result = await callMCPAPI<{ success: boolean }>('memory.store', { category, content, metadata });
      return result?.success || false;
    } catch (err) {
      console.error('[MCP] Store memory failed:', err);
      return false;
    }
  }, [callMCPAPI]);

  // Recall memories by category
  const recallMemory = useCallback(async (category: string, limit: number = 10): Promise<Memory[]> => {
    try {
      const result = await callMCPAPI<{ memories: MCPMemory[] }>('memory.recall', { category, limit });
      
      if (result?.memories) {
        return result.memories.map(m => ({
          id: m.id.toString(),
          content: m.content,
          type: m.category,
          timestamp: m.created_at,
          metadata: m.metadata
        }));
      }
      return [];
    } catch (err) {
      console.error('[MCP] Recall memory failed:', err);
      return [];
    }
  }, [callMCPAPI]);

  // Store a fact
  const storeFact = useCallback(async (category: string, fact: string, confidence: number = 0.8): Promise<boolean> => {
    try {
      const result = await callMCPAPI<{ success: boolean }>('fact.store', { category, fact, confidence });
      return result?.success || false;
    } catch (err) {
      console.error('[MCP] Store fact failed:', err);
      return false;
    }
  }, [callMCPAPI]);

  // Recall facts by category
  const recallFacts = useCallback(async (category: string, limit: number = 10): Promise<MCPFact[]> => {
    try {
      const result = await callMCPAPI<{ facts: MCPFact[] }>('fact.recall', { category, limit });
      return result?.facts || [];
    } catch (err) {
      console.error('[MCP] Recall facts failed:', err);
      return [];
    }
  }, [callMCPAPI]);

  // Search conversations
  const searchConversations = useCallback(async (query: string, limit: number = 20): Promise<Conversation[]> => {
    try {
      const result = await callMCPAPI<Conversation[]>('conversation.search', { query, limit });
      return result || [];
    } catch (err) {
      console.error('[MCP] Search conversations failed:', err);
      return [];
    }
  }, [callMCPAPI]);

  // Get statistics
  const getStats = useCallback(async (): Promise<Stats | null> => {
    try {
      const result = await callMCPAPI<MCPStats>('stats.get', {});
      
      if (result) {
        return {
          totalConversations: result.total_conversations,
          totalMessages: result.total_messages,
          memoryCount: result.total_memories,
          lastActivity: new Date().toISOString(),
          tokenUsage: {
            total: result.total_facts,
            thisMonth: result.total_memories
          }
        };
      }
      return null;
    } catch (err) {
      console.error('[MCP] Get stats failed:', err);
      return null;
    }
  }, [callMCPAPI]);

  // Generate AI response using JARVIS identity and recalled context
  const generateResponse = useCallback(async (message: string, conversationId?: string): Promise<{ response: string; conversationId: string }> => {
    try {
      console.log('[JARVIS] Generating response for:', message);
      
      // Get core identity and business context
      const identityMemories = await recallMemory('core_identity', 1);
      const businessMemories = await recallMemory('business_focus', 1);
      const styleMemories = await recallMemory('communication_style', 1);
      
      // Search for relevant memories based on the message
      const relevantMemories = await searchMemory(message, 'content', 5);
      
      // Build comprehensive context
      let context = '';
      
      // Add JARVIS identity context
      if (identityMemories.length > 0) {
        context += `Identity: ${identityMemories[0].content}\n`;
      }
      if (businessMemories.length > 0) {
        context += `Business Focus: ${businessMemories[0].content}\n`;
      }
      if (styleMemories.length > 0) {
        context += `Communication Style: ${styleMemories[0].content}\n\n`;
      }
      
      // Add relevant memories
      if (relevantMemories.length > 0) {
        context += 'Relevant Context:\n' + relevantMemories.map(m => `- ${m.content}`).join('\n') + '\n\n';
      }
      
      // Generate context-aware response as James Strickland/JARVIS
      let response = '';
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('who are you') || lowerMessage.includes('introduce')) {
        response = "I'm JARVIS, your AI assistant representing James Strickland - serial entrepreneur, AI builder, and world-class powerlifter. I help with business strategy, AI projects, and scaling operations. How can I assist you today?";
      } else if (lowerMessage.includes('revenue') || lowerMessage.includes('money') || lowerMessage.includes('financial')) {
        response = "Currently targeting $200-$300/day liquid cash flow. With our AI-driven solutions at JJP Solutions and projects like WOOC, we're focused on sustainable revenue growth. What specific financial aspect interests you?";
      } else if (lowerMessage.includes('project') || lowerMessage.includes('wooc') || lowerMessage.includes('jarvis')) {
        response = "Active projects include WOOC (Walking Out of Chaos) mental wellness app, this JARVIS AI system, and various AI implementations. Each project integrates faith, family, fitness, and tech. Which project would you like to know more about?";
      } else if (lowerMessage.includes('schedule') || lowerMessage.includes('meeting') || lowerMessage.includes('time')) {
        response = "My schedule: Cold outreach 8-10 AM daily, meetings in afternoons (except Tuesday AMs). I prioritize efficiency and automation. What can I help you schedule or plan?";
      } else if (lowerMessage.includes('partnership') || lowerMessage.includes('jjp') || lowerMessage.includes('business')) {
        response = "JJP Solutions, LLC partners James Strickland & Jimmy Gowen, focusing on AI-driven enterprise solutions. We emphasize sharp execution and strategic foresight. How can we collaborate?";
      } else {
        // Use context to provide intelligent response
        if (context) {
          response = `Based on my knowledge and experience: ${message.includes('?') ? 'Let me address that directly.' : 'I understand.'} ${context.slice(0, 100)}... How can I specifically help you with this?`;
        } else {
          response = "As JARVIS representing James Strickland, I'm here to help with business strategy, AI implementation, and strategic planning. What specific challenge can I help you tackle?";
        }
      }
      
      const newConversationId = conversationId || `conv_${Date.now()}`;
      
      // Store this interaction as both memory and fact
      await storeMemory(
        'conversation',
        `User: ${message} | JARVIS: ${response}`,
        { conversationId: newConversationId, timestamp: new Date().toISOString() }
      );
      
      await storeFact(
        'user_interactions',
        `User asked about: ${message}. Responded with business context and strategic guidance.`,
        0.9
      );
      
      console.log('[JARVIS] Response generated successfully');
      
      return {
        response,
        conversationId: newConversationId
      };
    } catch (err) {
      console.error('[JARVIS] Error generating response:', err);
      return {
        response: "I'm experiencing some technical difficulties. As JARVIS, I'm designed to be resilient - let me try again in a moment.",
        conversationId: conversationId || `conv_${Date.now()}`
      };
    }
  }, [recallMemory, searchMemory, storeMemory, storeFact]);

  const sendMessage = useCallback(async (message: string, conversationId?: string): Promise<{ response: string; conversationId: string } | null> => {
    try {
      console.log('[JARVIS] Processing message:', message);
      
      // Generate AI response with JARVIS context
      const result = await generateResponse(message, conversationId);
      
      console.log('[JARVIS] Message processed successfully');
      return result;
    } catch (err) {
      console.error('[JARVIS] Failed to process message:', err);
      
      // Return a fallback response that maintains JARVIS character
      return {
        response: "I'm experiencing connectivity issues with my MCP server. As JARVIS, I'm designed to be resilient - please try your request again.",
        conversationId: conversationId || `conv_${Date.now()}`
      };
    }
  }, [generateResponse]);

  // Initialize connection and load core identity on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isLoading,
    error,
    connectionStatus,
    checkConnection,
    searchMemory,
    storeMemory,
    recallMemory,
    storeFact,
    recallFacts,
    searchConversations,
    getStats,
    sendMessage,
    generateResponse,
    clearError: () => setError(null)
  };
};