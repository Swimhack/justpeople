import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useJarvisBrain } from '@/hooks/useJarvisBrain';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  MessageSquare, 
  Settings, 
  Database, 
  Activity, 
  Zap,
  TestTube,
  Plus,
  Play,
  Save,
  Eye,
  BarChart3
} from 'lucide-react';

interface SystemPrompt {
  id: string;
  name: string;
  prompt_template: string;
  ai_provider: string;
  is_active: boolean;
  parameters: any;
  version: number;
  created_at: string;
}

interface Memory {
  id: string;
  content: string;
  memory_type: string;
  source_type: string;
  relevance_score: number;
  access_count: number;
  created_at: string;
}

export default function JarvisControlPage() {
  const [activeTab, setActiveTab] = useState('chat');
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'claude'>('openai');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'jarvis', content: string, timestamp: Date}>>([]);
  
  // Prompt management state
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptTemplate, setNewPromptTemplate] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  // Memory management state
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryType, setNewMemoryType] = useState('general');

  const { askJarvis, storeMemory, loading } = useJarvisBrain();
  const { toast } = useToast();

  useEffect(() => {
    loadPrompts();
    loadMemories();
  }, [selectedProvider]);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('prompt-manager', {
        body: { action: 'get', provider: selectedProvider }
      });

      if (error) throw error;
      setPrompts(data.result.prompts || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const loadMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Error loading memories:', error);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = { role: 'user' as const, content: chatMessage, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');

    const response = await askJarvis({
      message: chatMessage,
      provider: selectedProvider,
      memory_search: true
    });

    if (response) {
      const jarvisMessage = { 
        role: 'jarvis' as const, 
        content: response.response, 
        timestamp: new Date() 
      };
      setChatHistory(prev => [...prev, jarvisMessage]);
    }
  };

  const createPrompt = async () => {
    if (!newPromptName.trim() || !newPromptTemplate.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both name and template for the prompt.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('prompt-manager', {
        body: {
          action: 'create',
          provider: selectedProvider,
          prompt_data: {
            name: newPromptName,
            prompt_template: newPromptTemplate,
            parameters: { temperature: 0.3, max_tokens: 1500 }
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Prompt created successfully.',
      });

      setNewPromptName('');
      setNewPromptTemplate('');
      loadPrompts();
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to create prompt.',
        variant: 'destructive',
      });
    }
  };

  const activatePrompt = async (promptId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('prompt-manager', {
        body: {
          action: 'activate',
          provider: selectedProvider,
          prompt_id: promptId
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Prompt activated successfully.',
      });

      loadPrompts();
    } catch (error) {
      console.error('Error activating prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate prompt.',
        variant: 'destructive',
      });
    }
  };

  const testPrompt = async (promptId: string) => {
    if (!testMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a test message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('prompt-manager', {
        body: {
          action: 'test',
          provider: selectedProvider,
          prompt_id: promptId,
          test_message: testMessage
        }
      });

      if (error) throw error;
      setTestResult(data.result.test_result);
    } catch (error) {
      console.error('Error testing prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to test prompt.',
        variant: 'destructive',
      });
    }
  };

  const addMemory = async () => {
    if (!newMemoryContent.trim()) return;

    await storeMemory(newMemoryContent, newMemoryType, 'admin');
    setNewMemoryContent('');
    loadMemories();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Jarvis Control Center
          </CardTitle>
          <CardDescription>
            Manage the AI brain system - prompts, memories, and interactions
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex items-center gap-4 mb-6">
        <Select value={selectedProvider} onValueChange={(value: 'openai' | 'claude') => setSelectedProvider(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI GPT-4.1</SelectItem>
            <SelectItem value="claude">Claude Sonnet 4</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline">Provider: {selectedProvider.toUpperCase()}</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat with Jarvis
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Prompts
          </TabsTrigger>
          <TabsTrigger value="memories" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Memory Bank
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jarvis Conversation</CardTitle>
              <CardDescription>
                Chat with Jarvis using the active system prompt and full context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full border rounded-md p-4 mb-4">
                <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {msg.role === 'user' ? 'You' : 'Jarvis'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask Jarvis anything..."
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  disabled={loading}
                />
                <Button onClick={handleChat} disabled={loading || !chatMessage.trim()}>
                  {loading ? <Activity className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create New Prompt</CardTitle>
                <CardDescription>Design custom system prompts for different use cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Prompt name"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                />
                <Textarea
                  placeholder="System prompt template (use {context}, {system_state}, {user_input} placeholders)"
                  value={newPromptTemplate}
                  onChange={(e) => setNewPromptTemplate(e.target.value)}
                  rows={8}
                />
                <Button onClick={createPrompt} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prompt
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prompt Testing</CardTitle>
                <CardDescription>Test prompts before activating them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Test message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
                {testResult && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{testResult.prompt_used}</Badge>
                      <Badge variant="outline">{testResult.processing_time_ms}ms</Badge>
                    </div>
                    <p className="text-sm">{testResult.response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Prompts</CardTitle>
              <CardDescription>Manage and activate system prompts for {selectedProvider}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <div key={prompt.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{prompt.name}</h3>
                        {prompt.is_active && <Badge>Active</Badge>}
                        <Badge variant="outline">v{prompt.version}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testPrompt(prompt.id)}
                          disabled={!testMessage.trim()}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => activatePrompt(prompt.id)}
                          disabled={prompt.is_active}
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {prompt.prompt_template}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Memory</CardTitle>
              <CardDescription>Store important information in Jarvis's memory bank</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Enter memory content..."
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  className="flex-1"
                />
                <div className="space-y-2">
                  <Select value={newMemoryType} onValueChange={setNewMemoryType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="user_behavior">User Behavior</SelectItem>
                      <SelectItem value="system_info">System Info</SelectItem>
                      <SelectItem value="business_rules">Business Rules</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addMemory} disabled={!newMemoryContent.trim()}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Memory Bank</CardTitle>
              <CardDescription>Browse stored memories and their usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memories.map((memory) => (
                  <div key={memory.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{memory.memory_type}</Badge>
                        <Badge variant="secondary">{memory.source_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Accessed {memory.access_count} times
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${memory.relevance_score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(memory.relevance_score * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm">{memory.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {new Date(memory.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memories.length}</div>
                <p className="text-xs text-muted-foreground">Stored in memory bank</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prompts.filter(p => p.is_active).length}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Memory Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(memories.map(m => m.memory_type)).size}
                </div>
                <p className="text-xs text-muted-foreground">Different categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Relevance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {memories.length > 0 
                    ? Math.round((memories.reduce((sum, m) => sum + m.relevance_score, 0) / memories.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Memory quality score</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Memory Usage by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(memories.reduce((acc, memory) => {
                  acc[memory.memory_type] = (acc[memory.memory_type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / memories.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}