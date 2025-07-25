import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema interfaces
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  tags: string[];
  category: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Memory {
  id: string;
  content: string;
  category: string;
  timestamp: string;
  tags: string[];
  searchable_content: string;
  relevance_score?: number;
  metadata?: Record<string, any>;
}

export interface Fact {
  id: string;
  fact: string;
  category: string;
  confidence: number;
  source: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Stat {
  id: string;
  metric_name: string;
  value: number;
  date: string;
  metadata?: Record<string, any>;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

// IndexedDB Schema
interface JarvisDBSchema extends DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: {
      'by-created': string;
      'by-updated': string;
      'by-category': string;
      'by-title': string;
    };
  };
  memories: {
    key: string;
    value: Memory;
    indexes: {
      'by-timestamp': string;
      'by-category': string;
      'by-searchable': string;
    };
  };
  facts: {
    key: string;
    value: Fact;
    indexes: {
      'by-timestamp': string;
      'by-category': string;
      'by-confidence': number;
    };
  };
  stats: {
    key: string;
    value: Stat;
    indexes: {
      'by-date': string;
      'by-metric': string;
    };
  };
  settings: {
    key: string;
    value: Setting;
    indexes: {
      'by-key': string;
    };
  };
}

class JarvisDB {
  private db: IDBPDatabase<JarvisDBSchema> | null = null;
  private readonly DB_NAME = 'jarvis-control-center';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<JarvisDBSchema>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Conversations store
        const conversationStore = db.createObjectStore('conversations', {
          keyPath: 'id',
        });
        conversationStore.createIndex('by-created', 'created_at');
        conversationStore.createIndex('by-updated', 'updated_at');
        conversationStore.createIndex('by-category', 'category');
        conversationStore.createIndex('by-title', 'title');

        // Memories store
        const memoryStore = db.createObjectStore('memories', {
          keyPath: 'id',
        });
        memoryStore.createIndex('by-timestamp', 'timestamp');
        memoryStore.createIndex('by-category', 'category');
        memoryStore.createIndex('by-searchable', 'searchable_content');

        // Facts store
        const factStore = db.createObjectStore('facts', {
          keyPath: 'id',
        });
        factStore.createIndex('by-timestamp', 'timestamp');
        factStore.createIndex('by-category', 'category');
        factStore.createIndex('by-confidence', 'confidence');

        // Stats store
        const statStore = db.createObjectStore('stats', {
          keyPath: 'id',
        });
        statStore.createIndex('by-date', 'date');
        statStore.createIndex('by-metric', 'metric_name');

        // Settings store
        const settingStore = db.createObjectStore('settings', {
          keyPath: 'id',
        });
        settingStore.createIndex('by-key', 'key');
      },
    });
  }

  // Conversation operations
  async saveConversation(conversation: Conversation): Promise<void> {
    await this.init();
    await this.db!.put('conversations', conversation);
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    await this.init();
    return await this.db!.get('conversations', id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    await this.init();
    return await this.db!.getAll('conversations');
  }

  async searchConversations(query: string, limit = 10): Promise<Conversation[]> {
    await this.init();
    const conversations = await this.db!.getAll('conversations');
    
    const searchQuery = query.toLowerCase();
    const results = conversations.filter(conv => {
      const titleMatch = conv.title.toLowerCase().includes(searchQuery);
      const messageMatch = conv.messages.some(msg => 
        msg.content.toLowerCase().includes(searchQuery)
      );
      const tagMatch = conv.tags.some(tag => 
        tag.toLowerCase().includes(searchQuery)
      );
      return titleMatch || messageMatch || tagMatch;
    });

    // Sort by relevance (updated_at for now)
    results.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    return results.slice(0, limit);
  }

  async deleteConversation(id: string): Promise<void> {
    await this.init();
    await this.db!.delete('conversations', id);
  }

  // Memory operations
  async saveMemory(memory: Memory): Promise<void> {
    await this.init();
    await this.db!.put('memories', memory);
  }

  async searchMemories(query: string, limit = 10): Promise<Memory[]> {
    await this.init();
    const memories = await this.db!.getAll('memories');
    
    const searchQuery = query.toLowerCase();
    const results = memories.filter(memory =>
      memory.searchable_content.toLowerCase().includes(searchQuery) ||
      memory.content.toLowerCase().includes(searchQuery) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );

    // Sort by relevance score, then by timestamp
    results.sort((a, b) => {
      if (a.relevance_score && b.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return results.slice(0, limit);
  }

  async getAllMemories(): Promise<Memory[]> {
    await this.init();
    return await this.db!.getAll('memories');
  }

  async deleteMemory(id: string): Promise<void> {
    await this.init();
    await this.db!.delete('memories', id);
  }

  // Fact operations
  async saveFact(fact: Fact): Promise<void> {
    await this.init();
    await this.db!.put('facts', fact);
  }

  async getAllFacts(): Promise<Fact[]> {
    await this.init();
    return await this.db!.getAll('facts');
  }

  async getFactsByCategory(category: string): Promise<Fact[]> {
    await this.init();
    return await this.db!.getAllFromIndex('facts', 'by-category', category);
  }

  // Stats operations
  async saveStat(stat: Stat): Promise<void> {
    await this.init();
    await this.db!.put('stats', stat);
  }

  async getStats(metricName?: string): Promise<Stat[]> {
    await this.init();
    if (metricName) {
      return await this.db!.getAllFromIndex('stats', 'by-metric', metricName);
    }
    return await this.db!.getAll('stats');
  }

  async updateDailyStats(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const conversations = await this.getAllConversations();
    const memories = await this.getAllMemories();
    
    // Calculate today's stats
    const todayConversations = conversations.filter(c => 
      c.created_at.startsWith(today)
    ).length;
    
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    
    await this.saveStat({
      id: `conversations-${today}`,
      metric_name: 'daily_conversations',
      value: todayConversations,
      date: today,
    });

    await this.saveStat({
      id: `total-conversations-${today}`,
      metric_name: 'total_conversations',
      value: conversations.length,
      date: today,
    });

    await this.saveStat({
      id: `total-messages-${today}`,
      metric_name: 'total_messages',
      value: totalMessages,
      date: today,
    });

    await this.saveStat({
      id: `total-memories-${today}`,
      metric_name: 'total_memories',
      value: memories.length,
      date: today,
    });
  }

  // Settings operations
  async getSetting(key: string): Promise<any> {
    await this.init();
    const settings = await this.db!.getAllFromIndex('settings', 'by-key', key);
    return settings[0]?.value;
  }

  async setSetting(key: string, value: any): Promise<void> {
    await this.init();
    const setting: Setting = {
      id: key,
      key,
      value,
      updated_at: new Date().toISOString(),
    };
    await this.db!.put('settings', setting);
  }

  // Utility operations
  async exportAllData(): Promise<{
    conversations: Conversation[];
    memories: Memory[];
    facts: Fact[];
    stats: Stat[];
    settings: Setting[];
    exportedAt: string;
  }> {
    await this.init();
    
    return {
      conversations: await this.getAllConversations(),
      memories: await this.getAllMemories(),
      facts: await this.getAllFacts(),
      stats: await this.getStats(),
      settings: await this.db!.getAll('settings'),
      exportedAt: new Date().toISOString(),
    };
  }

  async importData(data: any): Promise<void> {
    await this.init();
    
    if (data.conversations) {
      for (const conversation of data.conversations) {
        await this.saveConversation(conversation);
      }
    }
    
    if (data.memories) {
      for (const memory of data.memories) {
        await this.saveMemory(memory);
      }
    }
    
    if (data.facts) {
      for (const fact of data.facts) {
        await this.saveFact(fact);
      }
    }
    
    if (data.stats) {
      for (const stat of data.stats) {
        await this.saveStat(stat);
      }
    }
    
    if (data.settings) {
      for (const setting of data.settings) {
        await this.db!.put('settings', setting);
      }
    }
  }

  async clearAllData(): Promise<void> {
    await this.init();
    await this.db!.clear('conversations');
    await this.db!.clear('memories');
    await this.db!.clear('facts');
    await this.db!.clear('stats');
    await this.db!.clear('settings');
  }

  async getStorageInfo(): Promise<{
    conversations: number;
    memories: number;
    facts: number;
    stats: number;
    settings: number;
    totalSize: number;
  }> {
    await this.init();
    
    const conversations = await this.getAllConversations();
    const memories = await this.getAllMemories();
    const facts = await this.getAllFacts();
    const stats = await this.getStats();
    const settings = await this.db!.getAll('settings');
    
    // Rough size estimation
    const totalSize = JSON.stringify({
      conversations,
      memories,
      facts,
      stats,
      settings,
    }).length;

    return {
      conversations: conversations.length,
      memories: memories.length,
      facts: facts.length,
      stats: stats.length,
      settings: settings.length,
      totalSize,
    };
  }
}

// Export singleton instance
export const jarvisDB = new JarvisDB();