import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useJarvisBrain } from '@/hooks/useJarvisBrain';
import { Bot, Send, User, Loader2, Brain, Sparkles, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Jarvis, your advanced AI business assistant with access to comprehensive system memory and context. I can help you with analytics, content creation, user management insights, and provide intelligent responses based on stored knowledge. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'claude'>('openai');
  const [conversationId] = useState(() => `conv_${Date.now()}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { askJarvis, loading } = useJarvisBrain();
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');

    try {
      const response = await askJarvis({
        message: currentMessage,
        provider: selectedProvider,
        memory_search: true
      });

      if (response) {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Add metadata as a system message if there's useful context
        if (response.metadata.memories_used > 0 || response.metadata.context_used > 0) {
          const metadataMessage: Message = {
            id: `msg_${Date.now()}_metadata`,
            role: 'assistant',
            content: `🧠 Used ${response.metadata.memories_used} memories and ${response.metadata.context_used} context items (${response.metadata.processing_time_ms}ms, ${response.metadata.tokens_used} tokens)`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, metadataMessage]);
        }
      } else {
        const errorMessage: Message = {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m Jarvis, your advanced AI business assistant with access to comprehensive system memory and context. I can help you with analytics, content creation, user management insights, and provide intelligent responses based on stored knowledge. How can I assist you today?',
        timestamp: new Date(),
      },
    ]);
  };

  const quickActions = [
    { label: 'Generate Analytics Report', prompt: 'Generate a summary of our current analytics and user growth trends.' },
    { label: 'Content Ideas', prompt: 'Suggest 5 content ideas for our business blog.' },
    { label: 'User Engagement Tips', prompt: 'What are some strategies to improve user engagement on our platform?' },
    { label: 'SEO Recommendations', prompt: 'Provide SEO recommendations for improving our website\'s search ranking.' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Jarvis AI Brain Assistant
          </CardTitle>
          <CardDescription>
            Advanced AI with memory and context awareness for intelligent business assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">AI Provider:</span>
            </div>
            <Select value={selectedProvider} onValueChange={(value: 'openai' | 'claude') => setSelectedProvider(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI GPT-4.1</SelectItem>
                <SelectItem value="claude">Claude Sonnet 4</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">{selectedProvider.toUpperCase()}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => {
                  setInputMessage(action.prompt);
                  inputRef.current?.focus();
                }}
              >
                <Sparkles className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={clearConversation}
            >
              Clear Chat
            </Button>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <ScrollArea ref={scrollAreaRef} className="h-[600px] p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`flex-1 space-y-1 ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {message.role === 'user' ? 'You' : 'Jarvis'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`rounded-lg p-3 max-w-prose ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Jarvis</Badge>
                      </div>
                      <div className="rounded-lg p-3 bg-muted max-w-prose">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Jarvis anything about your business..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || loading}
                  size="icon"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}