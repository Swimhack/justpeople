import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Database, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useJarvisMCP } from '@/hooks/useJarvisMCP';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface JarvisChatInterfaceProps {
  conversationId?: string;
  onConversationUpdate?: (conversationId: string) => void;
}

export const JarvisChatInterface: React.FC<JarvisChatInterfaceProps> = ({
  conversationId,
  onConversationUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    sendMessage, 
    storeMemory, 
    isLoading, 
    error, 
    connectionStatus,
    checkConnection
  } = useJarvisMCP();

  // Force MCP connection on load and load conversation
  useEffect(() => {
    const initConnection = async () => {
      await checkConnection();
    };
    initConnection();
  }, [checkConnection]);

  // Load conversation history if available (removed getConversation dependency for now)
  useEffect(() => {
    if (conversationId) {
      console.log('[JARVIS Chat] Conversation ID set:', conversationId);
      // Future: implement conversation loading when MCP supports it
    }
  }, [conversationId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await sendMessage(inputMessage.trim(), conversationId);
      
      if (response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Store the conversation in memory (updated method signature)
        await storeMemory(
          'conversation',
          `User: ${userMessage.content}\nJARVIS: ${assistantMessage.content}`,
          { conversationId: response.conversationId }
        );

        // Notify parent of conversation update
        if (onConversationUpdate && response.conversationId) {
          onConversationUpdate(response.conversationId);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-full bg-background border-border">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">JARVIS AI Assistant</h3>
              <p className="text-xs text-muted-foreground">
                {isTyping ? 'Typing...' : 'AI-powered conversation interface'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={connectionStatus.connected ? "default" : "destructive"} 
              className="flex items-center gap-1"
            >
              <Cpu className="h-3 w-3" />
              {connectionStatus.connected ? "MCP Live" : "MCP Offline"}
            </Badge>
            {connectionStatus.connected && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium mb-2">
                Welcome to JARVIS {connectionStatus.connected ? "Live Mode" : "Offline Mode"}
              </p>
              <p className="text-sm mb-1">
                {connectionStatus.connected 
                  ? "Connected to MCP server for enhanced AI capabilities" 
                  : "Connection to MCP server failed - using fallback mode"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                All conversations are stored and searchable
              </p>
              {!connectionStatus.connected && connectionStatus.error && (
                <p className="text-xs text-destructive mt-2">
                  Error: {connectionStatus.error}
                </p>
              )}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-[80%]",
                message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              
              <div className={cn(
                "rounded-2xl px-4 py-3 max-w-full",
                message.role === 'user'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p className={cn(
                  "text-xs mt-1 opacity-70",
                  message.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        {error && (
          <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message to JARVIS..."
            className="flex-1 bg-background border-input"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};