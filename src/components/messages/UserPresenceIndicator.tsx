import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { Users, Circle, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const UserPresenceIndicator = () => {
  const { userPresence, typingUsers } = useRealtimeMessages();

  const onlineUsers = userPresence.filter(p => p.status === 'online');
  const offlineUsers = userPresence.filter(p => p.status === 'offline');
  const currentlyTyping = typingUsers.filter(t => t.is_typing);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Online Users */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-green-500 text-green-500" />
            <span className="text-sm font-medium">Online ({onlineUsers.length})</span>
          </div>
          {onlineUsers.length > 0 ? (
            <div className="space-y-1 pl-5">
              {onlineUsers.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{user.user_id.slice(0, 8)}...</span>
                  {user.custom_status && (
                    <Badge variant="secondary" className="text-xs">
                      {user.custom_status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pl-5">No users online</p>
          )}
        </div>

        {/* Currently Typing */}
        {currentlyTyping.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3 w-3 text-blue-500" />
              <span className="text-sm font-medium">Currently Typing</span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            </div>
            <div className="space-y-1 pl-5">
              {currentlyTyping.map((typing) => (
                <div key={`${typing.user_id}-${typing.recipient_id}`} className="text-sm text-muted-foreground">
                  {typing.user_id.slice(0, 8)}... is typing
                  {typing.recipient_id && ` to ${typing.recipient_id.slice(0, 8)}...`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Offline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
            <span className="text-sm font-medium">Recently Offline</span>
          </div>
          {offlineUsers.slice(0, 3).map((user) => (
            <div key={user.user_id} className="flex items-center justify-between text-sm pl-5">
              <span className="truncate text-muted-foreground">{user.user_id.slice(0, 8)}...</span>
              <span className="text-xs text-muted-foreground">
                {user.last_seen 
                  ? formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })
                  : 'Unknown'
                }
              </span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">{onlineUsers.length}</div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">{currentlyTyping.length}</div>
              <div className="text-xs text-muted-foreground">Typing</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};