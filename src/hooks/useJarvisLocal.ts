import { useState, useEffect, useCallback } from 'react';
import { jarvisDB, Conversation, Memory, Message, Fact } from '@/lib/jarvis-db';

interface LocalStats {
  totalConversations: number;
  totalMessages: number;
  totalMemories: number;
  storageUsed: number;
}

export const useJarvisLocal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database
  useEffect(() => {
    const initDB = async () => {
      try {
        await jarvisDB.init();
        setIsInitialized(true);
      } catch (err) {
        setError('Failed to initialize local database');
        console.error('DB initialization error:', err);
      }
    };
    initDB();
  }, []);

  // Generate simple AI responses locally
  const generateLocalResponse = useCallback((message: string): string => {
    const responses = [
      "I understand. Let me help you with that.",
      "That's an interesting point. Based on our previous conversations, I can see the pattern.",
      "I've stored this information in my memory for future reference.",
      "From what I recall, this relates to our earlier discussion about similar topics.",
      "I'm processing this locally and storing it in my knowledge base.",
      "This is now part of my local memory system. I can reference it in future conversations.",
      "I can see the connection to previous topics we've discussed.",
      "This information has been categorized and stored for quick retrieval.",
    ];
    
    // Simple keyword-based responses
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('remember') || lowerMessage.includes('memory')) {
      return "I'll remember this information and store it in my local memory system.";
    }
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      return "I can search through all our previous conversations and stored memories to find what you're looking for.";
    }
    if (lowerMessage.includes('export') || lowerMessage.includes('backup')) {
      return "I can help you export and backup all our conversation data and memories.";
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  // Create or get conversation
  const getOrCreateConversation = useCallback(async (conversationId?: string): Promise<string> => {
    if (conversationId) {
      const existing = await jarvisDB.getConversation(conversationId);
      if (existing) return conversationId;
    }

    // Create new conversation
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConversation: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      category: 'general',
    };

    await jarvisDB.saveConversation(newConversation);
    return newId;
  }, []);

  // Send message and get response
  const sendMessage = useCallback(async (
    message: string, 
    conversationId?: string
  ): Promise<{ response: string; conversationId: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const finalConversationId = await getOrCreateConversation(conversationId);
      const conversation = await jarvisDB.getConversation(finalConversationId);
      
      if (!conversation) {
        throw new Error('Failed to load conversation');
      }

      // Add user message
      const userMessage: Message = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      conversation.messages.push(userMessage);

      // Generate AI response
      const aiResponse = generateLocalResponse(message);
      const aiMessage: Message = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      conversation.messages.push(aiMessage);
      conversation.updated_at = new Date().toISOString();

      // Update title if it's the first user message
      if (conversation.messages.filter(m => m.role === 'user').length === 1) {
        conversation.title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      }

      // Auto-categorize based on content
      const categories = ['technical', 'planning', 'analysis', 'creative', 'general'];
      const messageContent = message.toLowerCase();
      
      if (messageContent.includes('code') || messageContent.includes('program') || messageContent.includes('debug')) {
        conversation.category = 'technical';
      } else if (messageContent.includes('plan') || messageContent.includes('strategy') || messageContent.includes('goal')) {
        conversation.category = 'planning';
      } else if (messageContent.includes('analyze') || messageContent.includes('data') || messageContent.includes('report')) {
        conversation.category = 'analysis';
      } else if (messageContent.includes('create') || messageContent.includes('design') || messageContent.includes('idea')) {
        conversation.category = 'creative';
      }

      // Auto-tag based on keywords
      const keywords = message.toLowerCase().match(/\b\w{4,}\b/g) || [];
      const significantKeywords = keywords.filter(word => 
        !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'what', 'when', 'where', 'how'].includes(word)
      ).slice(0, 3);
      
      conversation.tags = [...new Set([...conversation.tags, ...significantKeywords])];

      await jarvisDB.saveConversation(conversation);

      // Store as memory if it seems important
      if (message.length > 20 && !message.toLowerCase().startsWith('hi') && !message.toLowerCase().startsWith('hello')) {
        await storeMemory(message, 'conversation', {
          conversationId: finalConversationId,
          timestamp: new Date().toISOString(),
        });
      }

      // Update daily stats
      await jarvisDB.updateDailyStats();

      return {
        response: aiResponse,
        conversationId: finalConversationId,
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getOrCreateConversation, generateLocalResponse]);

  // Store memory
  const storeMemory = useCallback(async (
    content: string,
    type = 'general',
    metadata?: Record<string, any>
  ): Promise<boolean> => {
    try {
      const memory: Memory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        category: type,
        timestamp: new Date().toISOString(),
        tags: [],
        searchable_content: content.toLowerCase(),
        relevance_score: 1.0,
        metadata,
      };

      // Auto-generate tags from content
      const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
      memory.tags = words.slice(0, 5);

      await jarvisDB.saveMemory(memory);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store memory');
      return false;
    }
  }, []);

  // Search memories
  const searchMemory = useCallback(async (query: string, limit = 10): Promise<Memory[]> => {
    try {
      return await jarvisDB.searchMemories(query, limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search memories');
      return [];
    }
  }, []);

  // Search conversations
  const searchConversations = useCallback(async (query: string, limit = 10): Promise<Conversation[]> => {
    try {
      return await jarvisDB.searchConversations(query, limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search conversations');
      return [];
    }
  }, []);

  // Get conversation
  const getConversation = useCallback(async (conversationId: string): Promise<Conversation | null> => {
    try {
      const conversation = await jarvisDB.getConversation(conversationId);
      return conversation || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get conversation');
      return null;
    }
  }, []);

  // Get all conversations
  const getAllConversations = useCallback(async (): Promise<Conversation[]> => {
    try {
      return await jarvisDB.getAllConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get conversations');
      return [];
    }
  }, []);

  // Get all memories
  const getAllMemories = useCallback(async (): Promise<Memory[]> => {
    try {
      return await jarvisDB.getAllMemories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get memories');
      return [];
    }
  }, []);

  // Get stats
  const getStats = useCallback(async (): Promise<LocalStats> => {
    try {
      const storageInfo = await jarvisDB.getStorageInfo();
      return {
        totalConversations: storageInfo.conversations,
        totalMessages: storageInfo.totalSize, // Using total size as message count approximation
        totalMemories: storageInfo.memories,
        storageUsed: storageInfo.totalSize,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get stats');
      return {
        totalConversations: 0,
        totalMessages: 0,
        totalMemories: 0,
        storageUsed: 0,
      };
    }
  }, []);

  // Export data
  const exportData = useCallback(async () => {
    try {
      return await jarvisDB.exportAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      return null;
    }
  }, []);

  // Import data
  const importData = useCallback(async (data: any): Promise<boolean> => {
    try {
      await jarvisDB.importData(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
      return false;
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    try {
      await jarvisDB.deleteConversation(conversationId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    isInitialized,
    
    // Core messaging
    sendMessage,
    getConversation,
    getAllConversations,
    deleteConversation,
    
    // Memory operations
    storeMemory,
    searchMemory,
    getAllMemories,
    
    // Search
    searchConversations,
    
    // Analytics
    getStats,
    
    // Data management
    exportData,
    importData,
    
    // Utility
    clearError,
  };
};