import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  FileText, 
  FileSpreadsheet, 
  Lightbulb, 
  Users, 
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import WOOCAssistant from "@/components/wooc/WOOCAssistant";

export default function WOOCPage() {
  const [isAssistantMinimized, setIsAssistantMinimized] = useState(false);

  // Fetch recent threads
  const { data: recentThreads } = useQuery({
    queryKey: ['wooc-threads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_threads')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent documents
  const { data: recentDocs } = useQuery({
    queryKey: ['wooc-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch PRDs
  const { data: prds } = useQuery({
    queryKey: ['wooc-prds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Lightbulb className="h-8 w-8" />
            WOOC - Walking Out of Chaos
          </h1>
          <p className="text-muted-foreground mt-2">
            AI Project Management & Collaboration Hub
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/wooc/discussions">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
          </Link>
          <Link to="/dashboard/wooc/prd">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create PRD
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discussions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentThreads?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentDocs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              +5 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PRDs</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prds?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              1 in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 online now
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Discussions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Discussions
            </CardTitle>
            <CardDescription>
              Latest project discussions and threads
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentThreads && recentThreads.length > 0 ? (
              <div className="space-y-3">
                {recentThreads.map((thread) => (
                  <div key={thread.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{thread.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {thread.description?.substring(0, 60)}...
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={thread.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {thread.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {thread.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(thread.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2">No discussions yet</p>
                <Link to="/dashboard/wooc/discussions">
                  <Button variant="outline" size="sm" className="mt-2">
                    Start Discussion
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Project Progress
            </CardTitle>
            <CardDescription>
              Current development status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Requirements Gathering</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Technical Architecture</span>
                  <span>60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>AI Model Integration</span>
                  <span>30%</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Testing & Validation</span>
                  <span>10%</span>
                </div>
                <Progress value={10} className="h-2" />
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>PRD Template Created</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Team Collaboration Setup</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>AI Model Selection Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WOOC AI Assistant */}
        <div className="lg:row-span-2">
          <WOOCAssistant 
            isMinimized={isAssistantMinimized}
            onToggleMinimize={() => setIsAssistantMinimized(!isAssistantMinimized)}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/dashboard/wooc/discussions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Discussions</h3>
              <p className="text-sm text-muted-foreground">Project threads & communication</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/wooc/documents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Documents</h3>
              <p className="text-sm text-muted-foreground">Files & documentation</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/wooc/prd">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">PRD Builder</h3>
              <p className="text-sm text-muted-foreground">Product requirements docs</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/wooc/best-practices">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Best Practices</h3>
              <p className="text-sm text-muted-foreground">AI project guidelines</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}