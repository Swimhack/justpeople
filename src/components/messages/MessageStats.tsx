import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, EyeOff, AlertCircle, Archive } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  content: string;
  message_type: string;
  priority: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface MessageStatsProps {
  messages: Message[];
}

export const MessageStats = ({ messages }: MessageStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{messages.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unread</CardTitle>
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {messages.filter(m => !m.is_read).length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {messages.filter(m => m.priority === 'high').length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Archived</CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {messages.filter(m => m.is_archived).length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};