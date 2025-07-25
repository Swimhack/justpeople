import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  MessageCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface NewThreadData {
  title: string;
  description: string;
  priority: string;
}

export default function WOOCDiscussionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newThread, setNewThread] = useState<NewThreadData>({
    title: "",
    description: "",
    priority: "normal"
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch threads
  const { data: threads, isLoading } = useQuery({
    queryKey: ['wooc-threads', searchTerm, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('dev_threads')
        .select('*, dev_messages(count)')
        .order('updated_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (threadData: NewThreadData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('dev_threads')
        .insert({
          title: threadData.title,
          description: threadData.description,
          priority: threadData.priority,
          status: 'active',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wooc-threads'] });
      setIsDialogOpen(false);
      setNewThread({ title: "", description: "", priority: "normal" });
      toast({
        title: "Discussion Created",
        description: "Your discussion thread has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discussion thread.",
        variant: "destructive",
      });
    }
  });

  const handleCreateThread = () => {
    if (!newThread.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a thread title.",
        variant: "destructive",
      });
      return;
    }
    createThreadMutation.mutate(newThread);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'normal':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            WOOC Discussions
          </h1>
          <p className="text-muted-foreground mt-2">
            Project discussions and collaboration threads
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Discussion</DialogTitle>
              <DialogDescription>
                Start a new discussion thread for your AI project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  placeholder="Enter discussion title..."
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newThread.description}
                  onChange={(e) => setNewThread({ ...newThread, description: e.target.value })}
                  placeholder="Describe the discussion topic..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newThread.priority} onValueChange={(value) => setNewThread({ ...newThread, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateThread} disabled={createThreadMutation.isPending}>
                  {createThreadMutation.isPending ? "Creating..." : "Create Discussion"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Threads List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse">Loading discussions...</div>
            </CardContent>
          </Card>
        ) : threads && threads.length > 0 ? (
          threads.map((thread) => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(thread.status)}
                      <h3 className="font-semibold text-lg">{thread.title}</h3>
                      <Badge variant={getPriorityColor(thread.priority)}>
                        {thread.priority}
                      </Badge>
                      <Badge variant="outline">{thread.status}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{thread.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Created by you</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{(thread as any).dev_messages?.[0]?.count || 0} messages</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Thread
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discussions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? "Try adjusting your search or filters" 
                  : "Start your first discussion to collaborate with your team"}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Discussion
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}