import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, Brain, BarChart3, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JarvisChatInterface } from '@/components/jarvis/JarvisChatInterface';
import { MemoryManager } from '@/components/jarvis/MemoryManager';
import { StatsDashboard } from '@/components/jarvis/StatsDashboard';
import { DataManager } from '@/components/jarvis/DataManager';
import { SearchEngine } from '@/components/jarvis/SearchEngine';
import { ConversationAnalytics } from '@/components/jarvis/ConversationAnalytics';
import { useJarvisMCP } from '@/hooks/useJarvisMCP';
import { Button } from '@/components/ui/button';

export default function JarvisControlCenter() {
  const [activeConversation, setActiveConversation] = useState<string | undefined>();
  const { connectionStatus, checkConnection, isLoading } = useJarvisMCP();

  const handleConversationUpdate = (conversationId: string) => {
    setActiveConversation(conversationId);
  };

  // Force connection check on mount and periodically
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">JARVIS Control Center</h1>
              <p className="text-muted-foreground">
                Advanced AI assistant with memory-powered conversations
              </p>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              connectionStatus.connected 
                ? 'bg-green-500/10' 
                : 'bg-red-500/10'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus.connected 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`}></div>
              <span className={`text-xs font-medium ${
                connectionStatus.connected 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                MCP Server {connectionStatus.connected ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-blue-600 font-medium">Memory System Active</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={isLoading}
              className="h-7 px-3"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {connectionStatus.error && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full">
                <span className="text-xs text-yellow-600 font-medium">
                  Error: {connectionStatus.error}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat Interface</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Memory & History</span>
              <span className="sm:hidden">Memory</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Chat Interface Tab */}
          <TabsContent value="chat" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
              {/* Main Chat Area */}
              <div className="lg:col-span-3">
                <JarvisChatInterface
                  conversationId={activeConversation}
                  onConversationUpdate={handleConversationUpdate}
                />
              </div>
              
              {/* Side Panel - Quick Memory Access */}
              <div className="lg:col-span-1">
                <Card className="h-full bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      Quick Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium text-foreground mb-1">Memory-Powered</p>
                      <p className="text-xs">JARVIS remembers your conversations and learns from your interactions.</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium text-foreground mb-1">MCP Integration</p>
                      <p className="text-xs">
                        {connectionStatus.connected 
                          ? 'Connected to live MCP server for enhanced capabilities.' 
                          : 'MCP server unavailable - using fallback mode.'
                        }
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium text-foreground mb-1">Real-time Sync</p>
                      <p className="text-xs">All conversations are automatically saved and searchable.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Memory & History Tab */}
          <TabsContent value="memory" className="space-y-0">
            <div className="h-[calc(100vh-12rem)]">
              <MemoryManager />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-0">
            <div className="h-[calc(100vh-12rem)]">
              <StatsDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}