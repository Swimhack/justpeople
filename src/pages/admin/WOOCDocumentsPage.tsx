import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Eye,
  Plus,
  FileIcon,
  Trash2,
  Edit
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TextDocument {
  title: string;
  content: string;
  category: string;
}

export default function WOOCDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [textDoc, setTextDoc] = useState<TextDocument>({
    title: "",
    content: "",
    category: "general"
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch files
  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['wooc-files', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch text documents (using content table)
  const { data: textDocs, isLoading: textDocsLoading } = useQuery({
    queryKey: ['wooc-text-docs', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('content')
        .select('*')
        .order('updated_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save file record
      const { data, error } = await supabase
        .from('files')
        .insert({
          name: file.name,
          original_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          bucket_name: 'message-files',
          uploaded_by: user.id,
          is_public: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wooc-files'] });
      setIsUploadDialogOpen(false);
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload file.",
        variant: "destructive",
      });
    }
  });

  // Text document creation mutation
  const createTextDocMutation = useMutation({
    mutationFn: async (docData: TextDocument) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('content')
        .insert({
          title: docData.title,
          content: docData.content,
          slug: docData.title.toLowerCase().replace(/\s+/g, '-'),
          status: 'published',
          author_id: user.id,
          metadata: { category: docData.category, type: 'wooc-document' }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wooc-text-docs'] });
      setIsTextDialogOpen(false);
      setTextDoc({ title: "", content: "", category: "general" });
      toast({
        title: "Document Created",
        description: "Your text document has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create document.",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
  };

  const handleCreateTextDoc = () => {
    if (!textDoc.title.trim() || !textDoc.content.trim()) {
      toast({
        title: "Error",
        description: "Please enter both title and content.",
        variant: "destructive",
      });
      return;
    }
    createTextDocMutation.mutate(textDoc);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return FileIcon;
    if (mimeType.startsWith('image/')) return FileIcon;
    if (mimeType.includes('pdf')) return FileIcon;
    if (mimeType.includes('document') || mimeType.includes('text')) return FileText;
    return FileIcon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            WOOC Documents
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage project documentation and files
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
                <DialogDescription>
                  Upload a file to your WOOC project documentation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full p-2 border rounded-md"
                    accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: PDF, Word docs, text files, images
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Text Document</DialogTitle>
                <DialogDescription>
                  Create a new text document for your project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-title">Title</Label>
                  <Input
                    id="doc-title"
                    value={textDoc.title}
                    onChange={(e) => setTextDoc({ ...textDoc, title: e.target.value })}
                    placeholder="Document title..."
                  />
                </div>
                <div>
                  <Label htmlFor="doc-content">Content</Label>
                  <Textarea
                    id="doc-content"
                    value={textDoc.content}
                    onChange={(e) => setTextDoc({ ...textDoc, content: e.target.value })}
                    placeholder="Paste or type your document content here..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsTextDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTextDoc} disabled={createTextDocMutation.isPending}>
                    {createTextDocMutation.isPending ? "Creating..." : "Create Document"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="text-docs">Text Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          {filesLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">Loading files...</div>
              </CardContent>
            </Card>
          ) : files && files.length > 0 ? (
            <div className="grid gap-4">
              {files.map((file) => {
                const FileIconComponent = getFileIcon(file.mime_type);
                return (
                  <Card key={file.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileIconComponent className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-medium">{file.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.file_size)} • 
                              Uploaded {new Date(file.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Upload className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No files uploaded</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first file to start building your project documentation.
                </p>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First File
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="text-docs" className="space-y-4">
          {textDocsLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">Loading documents...</div>
              </CardContent>
            </Card>
          ) : textDocs && textDocs.length > 0 ? (
            <div className="grid gap-4">
              {textDocs.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-2">{doc.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          {doc.content?.substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {(doc.metadata as any)?.category || 'general'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Updated {new Date(doc.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No text documents</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first text document to start documenting your project.
                </p>
                <Button onClick={() => setIsTextDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Document
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}