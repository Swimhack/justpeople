import React, { useState, useEffect } from 'react';
import { Search, Clock, Tag, MessageSquare, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useJarvisMCP } from '@/hooks/useJarvisMCP';

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
  messages: any[];
  created_at: string;
  updated_at: string;
}

export const MemoryManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState('memories');
  
  const { searchMemory, searchConversations, isLoading } = useJarvisMCP();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [memoriesData, conversationsData] = await Promise.all([
        searchMemory('general', 'content', 20),
        searchConversations('', 20)
      ]);
      
      setMemories(memoriesData);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadInitialData();
      return;
    }

    try {
      if (activeTab === 'memories') {
        const results = await searchMemory(searchQuery, 'content', 50);
        setMemories(results);
      } else {
        const results = await searchConversations(searchQuery, 50);
        setConversations(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      conversation: 'bg-blue-500/10 text-blue-500',
      memory: 'bg-green-500/10 text-green-500',
      note: 'bg-yellow-500/10 text-yellow-500',
      task: 'bg-purple-500/10 text-purple-500',
      default: 'bg-gray-500/10 text-gray-500'
    };
    return colors[type] || colors.default;
  };

  return (
    <Card className="h-full bg-background border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Memory & Conversations
        </CardTitle>
        
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search memories and conversations..."
              className="pl-10 bg-background border-input"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            size="icon"
            variant="outline"
            className="border-input"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-4 mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="memories" className="text-sm">
              Memories ({memories.length})
            </TabsTrigger>
            <TabsTrigger value="conversations" className="text-sm">
              Conversations ({conversations.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 px-4 pb-4">
            <TabsContent value="memories" className="h-full mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {memories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No memories found</p>
                      <p className="text-sm">Start chatting to create memories</p>
                    </div>
                  ) : (
                    memories.map((memory) => (
                      <Card key={memory.id} className="p-3 bg-card border-border hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className={getTypeColor(memory.type)}>
                            <Tag className="w-3 h-3 mr-1" />
                            {memory.type}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(memory.timestamp)}
                          </div>
                        </div>
                        <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                          {memory.content}
                        </p>
                        {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(memory.metadata).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="conversations" className="h-full mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No conversations found</p>
                      <p className="text-sm">Start a new conversation with JARVIS</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <Card key={conversation.id} className="p-3 bg-card border-border hover:bg-muted/30 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-foreground line-clamp-1">
                            {conversation.title || `Conversation ${conversation.id.slice(0, 8)}`}
                          </h4>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(conversation.updated_at)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {conversation.messages?.length || 0} messages
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Created {formatDate(conversation.created_at)}
                          </span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};