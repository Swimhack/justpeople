import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, DollarSign, Calendar, Plus, Search, Filter, Upload } from "lucide-react";
import ContactImporter from "@/components/ContactImporter";

interface Lead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  lead_score: number;
  lead_status: string;
  qualification_status: string;
  tags: string[];
  created_at: string;
  last_activity_at: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  deal_status: string;
  expected_close_date?: string;
  created_at: string;
  pipeline_stages: {
    name: string;
    probability: number;
  };
}

interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
  pipeline_stages: Array<{
    id: string;
    name: string;
    stage_order: number;
    probability: number;
  }>;
}

export default function CRMDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [showNewDealDialog, setShowNewDealDialog] = useState(false);
  const [newLead, setNewLead] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    company: "",
    tags: ""
  });
  const [newDeal, setNewDeal] = useState({
    title: "",
    value: "",
    pipeline_id: "",
    stage_id: "",
    description: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (leadsError) throw leadsError;

      // Fetch deals with pipeline stage info
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select(`
          *,
          pipeline_stages!inner(name, probability)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (dealsError) throw dealsError;

      // Fetch pipelines with stages
      const { data: pipelinesData, error: pipelinesError } = await supabase
        .from("pipelines")
        .select(`
          *,
          pipeline_stages(id, name, stage_order, probability)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (pipelinesError) throw pipelinesError;

      setLeads(leadsData || []);
      setDeals(dealsData || []);
      setPipelines(pipelinesData || []);
    } catch (error: any) {
      console.error("Error fetching CRM data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch CRM data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLead = async () => {
    try {
      const response = await supabase.functions.invoke('crm-lead-processor', {
        body: {
          action: 'create',
          data: {
            ...newLead,
            tags: newLead.tags ? newLead.tags.split(',').map(tag => tag.trim()) : []
          }
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "Lead created successfully",
      });

      setShowNewLeadDialog(false);
      setNewLead({
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        company: "",
        tags: ""
      });
      fetchData();
    } catch (error: any) {
      console.error("Error creating lead:", error);
      toast({
        title: "Error",
        description: "Failed to create lead",
        variant: "destructive",
      });
    }
  };

  const createDeal = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("deals")
        .insert({
          title: newDeal.title,
          value: parseFloat(newDeal.value),
          pipeline_id: newDeal.pipeline_id,
          stage_id: newDeal.stage_id,
          description: newDeal.description,
          assigned_to: user.user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deal created successfully",
      });

      setShowNewDealDialog(false);
      setNewDeal({
        title: "",
        value: "",
        pipeline_id: "",
        stage_id: "",
        description: ""
      });
      fetchData();
    } catch (error: any) {
      console.error("Error creating deal:", error);
      toast({
        title: "Error",
        description: "Failed to create deal",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.company?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || lead.lead_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalLeadValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const averageScore = leads.length > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.lead_score, 0) / leads.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading CRM data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">Manage your leads, deals, and customer relationships</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">
              Active prospects in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalLeadValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total potential revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}</div>
            <p className="text-xs text-muted-foreground">
              Lead qualification score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.filter(d => d.deal_status === 'open').length}</div>
            <p className="text-xs text-muted-foreground">
              Deals in progress
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="import">Import Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Lead</DialogTitle>
                  <DialogDescription>
                    Add a new lead to your CRM pipeline
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={newLead.first_name}
                        onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={newLead.last_name}
                        onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={newLead.company}
                      onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={newLead.tags}
                      onChange={(e) => setNewLead({ ...newLead, tags: e.target.value })}
                      placeholder="hot-lead, enterprise, demo-requested"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewLeadDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createLead} disabled={!newLead.email}>
                    Create Lead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Your latest prospects and their qualification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">
                          {lead.first_name} {lead.last_name} ({lead.email})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.company && `${lead.company} • `}
                          Score: {lead.lead_score}/100
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {lead.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      <Badge className={getStatusBadgeColor(lead.lead_status)}>
                        {lead.lead_status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredLeads.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No leads found matching your criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showNewDealDialog} onOpenChange={setShowNewDealDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Deal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                  <DialogDescription>
                    Add a new deal to your sales pipeline
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="deal_title">Deal Title *</Label>
                    <Input
                      id="deal_title"
                      value={newDeal.title}
                      onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deal_value">Deal Value *</Label>
                    <Input
                      id="deal_value"
                      type="number"
                      value={newDeal.value}
                      onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pipeline">Pipeline *</Label>
                    <Select value={newDeal.pipeline_id} onValueChange={(value) => {
                      setNewDeal({ ...newDeal, pipeline_id: value, stage_id: "" });
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelines.map((pipeline) => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newDeal.pipeline_id && (
                    <div>
                      <Label htmlFor="stage">Stage *</Label>
                      <Select value={newDeal.stage_id} onValueChange={(value) => {
                        setNewDeal({ ...newDeal, stage_id: value });
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {pipelines
                            .find(p => p.id === newDeal.pipeline_id)
                            ?.pipeline_stages
                            .sort((a, b) => a.stage_order - b.stage_order)
                            .map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name} ({stage.probability}%)
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="deal_description">Description</Label>
                    <Textarea
                      id="deal_description"
                      value={newDeal.description}
                      onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewDealDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createDeal} 
                    disabled={!newDeal.title || !newDeal.value || !newDeal.pipeline_id || !newDeal.stage_id}
                  >
                    Create Deal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Deals</CardTitle>
              <CardDescription>Your current sales opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        ${deal.value.toLocaleString()} {deal.currency}
                        {deal.expected_close_date && ` • Expected: ${new Date(deal.expected_close_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {deal.pipeline_stages.name} ({deal.pipeline_stages.probability}%)
                      </Badge>
                      <Badge 
                        className={deal.deal_status === 'won' ? 'bg-green-100 text-green-800' : 
                                 deal.deal_status === 'lost' ? 'bg-red-100 text-red-800' : 
                                 'bg-blue-100 text-blue-800'}
                      >
                        {deal.deal_status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {deals.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No deals found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>Visual overview of your sales process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pipelines.map((pipeline) => (
                  <Card key={pipeline.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      {pipeline.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {pipeline.pipeline_stages
                          ?.sort((a, b) => a.stage_order - b.stage_order)
                          .map((stage) => (
                            <div key={stage.id} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm font-medium">{stage.name}</span>
                              <Badge variant="outline">{stage.probability}%</Badge>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <ContactImporter />
        </TabsContent>
      </Tabs>
    </div>
  );
}