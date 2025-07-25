import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Edit,
  Eye,
  Download,
  Save,
  FileText,
  Target,
  Users,
  Calendar,
  CheckSquare,
  Upload,
  FileUp,
  Copy,
  FileCode
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PRDSection {
  title: string;
  content: string;
}

interface PRDData {
  title: string;
  overview: string;
  sections: PRDSection[];
}

const DEFAULT_PRD_TEMPLATE: PRDSection[] = [
  {
    title: "1. Executive Summary",
    content: "Brief overview of the product, its purpose, and key benefits."
  },
  {
    title: "2. Product Overview",
    content: "Detailed description of what the product is and what it does."
  },
  {
    title: "3. Target Audience",
    content: "Who are the primary users? What are their needs and pain points?"
  },
  {
    title: "4. Problem Statement",
    content: "What specific problem does this product solve?"
  },
  {
    title: "5. Goals & Objectives",
    content: "What are the business and user goals this product aims to achieve?"
  },
  {
    title: "6. Success Metrics",
    content: "How will you measure the success of this product?"
  },
  {
    title: "7. Features & Requirements",
    content: "Detailed list of features and functional requirements."
  },
  {
    title: "8. Technical Specifications",
    content: "Technical requirements, architecture, and constraints."
  },
  {
    title: "9. User Stories",
    content: "User stories and use cases for key functionality."
  },
  {
    title: "10. Timeline & Milestones",
    content: "Development timeline with key milestones and deliverables."
  },
  {
    title: "11. Risks & Assumptions",
    content: "Potential risks and key assumptions made during planning."
  },
  {
    title: "12. Resources & Dependencies",
    content: "Required resources, team members, and external dependencies."
  }
];

export default function WOOCPRDPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPRD, setEditingPRD] = useState<any>(null);
  const [markdownContent, setMarkdownContent] = useState("");
  const [showMarkdownImport, setShowMarkdownImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prdData, setPrdData] = useState<PRDData>({
    title: "",
    overview: "",
    sections: DEFAULT_PRD_TEMPLATE
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch PRDs
  const { data: prds, isLoading } = useQuery({
    queryKey: ['wooc-prds', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('content')
        .select('*')
        .eq('metadata->>type', 'prd')
        .order('updated_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Create/Update PRD mutation
  const savePRDMutation = useMutation({
    mutationFn: async (data: { id?: string; prdData: PRDData }) => {
      if (!user) throw new Error('User not authenticated');

      const contentData = {
        title: data.prdData.title,
        content: JSON.stringify(data.prdData),
        slug: data.prdData.title.toLowerCase().replace(/\s+/g, '-'),
        status: 'published',
        author_id: user.id,
        metadata: { type: 'prd', overview: data.prdData.overview }
      };

      if (data.id) {
        // Update existing PRD
        const { data: result, error } = await supabase
          .from('content')
          .update(contentData)
          .eq('id', data.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        // Create new PRD
        const { data: result, error } = await supabase
          .from('content')
          .insert(contentData)
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wooc-prds'] });
      setIsDialogOpen(false);
      setEditingPRD(null);
      setPrdData({
        title: "",
        overview: "",
        sections: DEFAULT_PRD_TEMPLATE
      });
      toast({
        title: "PRD Saved",
        description: "Your Product Requirements Document has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save PRD.",
        variant: "destructive",
      });
    }
  });

  const handleSavePRD = () => {
    if (!prdData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a PRD title.",
        variant: "destructive",
      });
      return;
    }
    savePRDMutation.mutate({ id: editingPRD?.id, prdData });
  };

  const handleEditPRD = (prd: any) => {
    try {
      const parsedContent = JSON.parse(prd.content);
      setPrdData(parsedContent);
      setEditingPRD(prd);
      setIsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load PRD content.",
        variant: "destructive",
      });
    }
  };

  const handleNewPRD = () => {
    setPrdData({
      title: "",
      overview: "",
      sections: DEFAULT_PRD_TEMPLATE
    });
    setEditingPRD(null);
    setIsDialogOpen(true);
  };

  const updateSection = (index: number, content: string) => {
    const updatedSections = [...prdData.sections];
    updatedSections[index] = { ...updatedSections[index], content };
    setPrdData({ ...prdData, sections: updatedSections });
  };

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .md or .txt file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setMarkdownContent(content);
      
      // Process with AI first, then parse markdown
      await processDocumentWithAI(content);
      parseMarkdownToPRD(content);
    };
    reader.readAsText(file);
  }, []);

  // Process document with Claude AI
  const processDocumentWithAI = useCallback(async (content: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('wooc-document-processor', {
        body: {
          document: content,
          type: 'prd'
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        const analysis = data.analysis;
        
        // Show AI insights to user
        toast({
          title: "AI Analysis Complete",
          description: `Claude 4 Opus has analyzed your document and provided ${analysis.key_insights?.length || 0} key insights.`,
        });

        // You could store this analysis or show it in a modal
        console.log('AI Analysis:', analysis);
        
        return analysis;
      }
    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        title: "AI Processing Failed",
        description: "Document uploaded but AI analysis failed. You can still edit manually.",
        variant: "destructive",
      });
    }
    return null;
  }, [toast]);

  // Parse markdown content and populate PRD sections
  const parseMarkdownToPRD = useCallback((markdown: string) => {
    const lines = markdown.split('\n');
    let title = '';
    let overview = '';
    const sections: PRDSection[] = [];
    let currentSection: PRDSection | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract title from first h1
      if (trimmed.startsWith('# ') && !title) {
        title = trimmed.substring(2).trim();
        continue;
      }

      // Check for section headers (h2, h3)
      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }

        // Start new section
        const sectionTitle = trimmed.replace(/^#+\s*/, '');
        currentSection = { title: sectionTitle, content: '' };
        currentContent = [];
        continue;
      }

      // Add content to current section or overview
      if (currentSection) {
        currentContent.push(line);
      } else if (!overview && trimmed && !trimmed.startsWith('#')) {
        overview += (overview ? '\n' : '') + line;
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    // Update PRD data
    setPrdData(prev => ({
      ...prev,
      title: title || prev.title,
      overview: overview || prev.overview,
      sections: sections.length > 0 ? sections : prev.sections
    }));

    toast({
      title: "Markdown imported",
      description: `Successfully imported ${sections.length} sections from markdown.`,
    });
  }, []);

  // Handle markdown paste
  const handleMarkdownPaste = useCallback(async () => {
    if (markdownContent.trim()) {
      // Process with AI first, then parse markdown
      await processDocumentWithAI(markdownContent);
      parseMarkdownToPRD(markdownContent);
      setMarkdownContent('');
      setShowMarkdownImport(false);
    }
  }, [markdownContent, parseMarkdownToPRD, processDocumentWithAI]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            WOOC PRD Builder
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage Product Requirements Documents
          </p>
        </div>
        <Button onClick={handleNewPRD}>
          <Plus className="h-4 w-4 mr-2" />
          New PRD
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search PRDs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* PRDs List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse">Loading PRDs...</div>
            </CardContent>
          </Card>
        ) : prds && prds.length > 0 ? (
          prds.map((prd) => (
            <Card key={prd.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{prd.title}</h3>
                    <p className="text-muted-foreground mb-4">
                      {(prd.metadata as any)?.overview || 'No overview provided'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {new Date(prd.updated_at).toLocaleDateString()}</span>
                      <Badge variant="outline">PRD</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditPRD(prd)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No PRDs created</h3>
              <p className="text-muted-foreground mb-4">
                Create your first Product Requirements Document to define your AI project scope.
              </p>
              <Button onClick={handleNewPRD}>
                <Plus className="h-4 w-4 mr-2" />
                Create First PRD
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* PRD Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPRD ? "Edit PRD" : "Create New PRD"}
            </DialogTitle>
            <DialogDescription>
              Build a comprehensive Product Requirements Document for your AI project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="prd-title">PRD Title</Label>
                <Input
                  id="prd-title"
                  value={prdData.title}
                  onChange={(e) => setPrdData({ ...prdData, title: e.target.value })}
                  placeholder="Enter PRD title..."
                />
              </div>
              <div>
                <Label htmlFor="prd-overview">Executive Overview</Label>
                <Textarea
                  id="prd-overview"
                  value={prdData.overview}
                  onChange={(e) => setPrdData({ ...prdData, overview: e.target.value })}
                  placeholder="Brief executive summary of the product..."
                  rows={3}
                />
              </div>
            </div>

            {/* Markdown Import Section */}
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Import from Markdown
                </CardTitle>
                <CardDescription>
                  Upload a .md file or paste markdown content to automatically populate your PRD sections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload .md File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMarkdownImport(!showMarkdownImport)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Paste Markdown
                  </Button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Markdown paste area */}
                {showMarkdownImport && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="markdown-content">Paste Your Markdown Content</Label>
                      <Textarea
                        id="markdown-content"
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        placeholder="Paste your markdown content here...&#10;&#10;# Your PRD Title&#10;&#10;Brief overview paragraph...&#10;&#10;## Section 1&#10;Content for section 1...&#10;&#10;## Section 2&#10;Content for section 2..."
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleMarkdownPaste}
                        disabled={!markdownContent.trim()}
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Import Content
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMarkdownContent('');
                          setShowMarkdownImport(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PRD Sections */}
            <div>
              <h3 className="text-lg font-semibold mb-4">PRD Sections</h3>
              <Accordion type="single" collapsible className="space-y-2">
                {prdData.sections.map((section, index) => (
                  <AccordionItem key={index} value={`section-${index}`}>
                    <AccordionTrigger className="text-left">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateSection(index, e.target.value)}
                        placeholder={`Enter content for ${section.title}...`}
                        rows={6}
                        className="mt-2"
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePRD} disabled={savePRDMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {savePRDMutation.isPending ? "Saving..." : "Save PRD"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}