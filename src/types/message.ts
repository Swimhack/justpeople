export interface MediaFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  content: string;
  message_type: string;
  priority: string;
  is_read: boolean;
  is_archived: boolean;
  video_room_id?: string | null;
  attachments?: MediaFile[];
  created_at: string;
  updated_at: string;
}