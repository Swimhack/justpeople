import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { FileUpload } from "@/components/messages/FileUpload";
import { useUserActivityLogger } from "@/hooks/useUserActivityLogger";

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (message: {
    recipient_id: string;
    subject: string;
    content: string;
    priority: string;
    attachments: any[];
  }) => void;
}

export const NewMessageDialog = ({
  open,
  onOpenChange,
  onSendMessage
}: NewMessageDialogProps) => {
  const { logCommunication, logFormSubmission, logInteraction } = useUserActivityLogger();
  const [newMessage, setNewMessage] = useState({
    recipient_id: "",
    subject: "",
    content: "",
    priority: "normal",
    attachments: [] as any[]
  });

  const handleSendMessage = () => {
    // Log message sending activity
    logCommunication('send', 'message', {
      recipientId: newMessage.recipient_id || 'broadcast',
      subject: newMessage.subject,
      priority: newMessage.priority,
      hasAttachments: newMessage.attachments.length > 0,
      attachmentCount: newMessage.attachments.length,
      contentLength: newMessage.content.length
    });

    logFormSubmission('new_message', true, {
      recipientType: newMessage.recipient_id ? 'direct' : 'broadcast',
      priority: newMessage.priority,
      attachmentTypes: newMessage.attachments.map(a => a.type)
    });

    onSendMessage(newMessage);
    setNewMessage({
      recipient_id: "",
      subject: "",
      content: "",
      priority: "normal",
      attachments: []
    });
  };

  const handleFileUploaded = (file: { url: string; name: string; type: string; size: number }) => {
    setNewMessage(prev => ({
      ...prev,
      attachments: [...prev.attachments, file]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => logInteraction('new_message_button', 'click')}>
          <Send className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send New Message</DialogTitle>
          <DialogDescription>
            Compose a new message to send to team members.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Recipient (optional)</label>
            <Input
              placeholder="Enter UUID or leave empty for broadcast"
              value={newMessage.recipient_id}
              onChange={(e) => setNewMessage(prev => ({ ...prev, recipient_id: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to send as broadcast message to all users
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Subject</label>
            <Input
              placeholder="Message subject"
              value={newMessage.subject}
              onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select value={newMessage.priority} onValueChange={(value) => setNewMessage(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Type your message here..."
              value={newMessage.content}
              onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Attachments</label>
            <FileUpload onFileUploaded={handleFileUploaded} />
            
            {/* Show attached files with multimedia preview */}
            {newMessage.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                <label className="text-sm font-medium">Attached Files ({newMessage.attachments.length}):</label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                  {newMessage.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded mb-2 last:mb-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {file.type.startsWith('image/') && (
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(1)} MB • {file.type.split('/')[0]}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewMessage(prev => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};