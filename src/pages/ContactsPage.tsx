import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Search, Filter, Plus, Send, Upload, Phone, Building, MapPin, User } from "lucide-react";
import ContactImporter from "@/components/ContactImporter";
import { ImportJJPContactsButton } from "@/components/ImportJJPContactsButton";
import { DirectImportJJPContacts } from "@/components/DirectImportJJPContacts";
import { ContactStats } from "@/components/ContactStats";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  custom_fields?: {
    phone?: string;
    title?: string;
    location?: string;
    original_status?: string;
  };
  lead_score?: number;
  tags?: string[];
  last_activity_at?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    message: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
    // Also trigger immediate import check
    checkAndAutoImport();
  }, []);

  const checkAndAutoImport = async () => {
    try {
      // Check if we should auto-import
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      if (contactCount === 0) {
        // Auto-import JJP contacts immediately
        await performDirectImport();
      }
    } catch (error) {
      console.error('Auto-import check failed:', error);
    }
  };

  const performDirectImport = async () => {
    const JJP_CONTACTS = [
      {
        name: "Keith Pheeney",
        email: "keith@swimmingpoolhq.com",
        phone: "4092569444",
        company: "Swimming Pool HQ",
        title: "CEO",
        location: "Bryan/College Station, TX",
        notes: "CEO of Swimming Pool HQ",
        tags: ["JJP", "Lead", "CEO"],
        leadScore: 85
      },
      {
        name: "James Seward",
        email: "james@swimhack.com",
        phone: "9796768798",
        company: "Swimhack",
        title: "President",
        location: "Bryan, TX",
        notes: "President of Swimhack",
        tags: ["JJP", "Lead", "President", "Technology"],
        leadScore: 90
      },
      {
        name: "Bobby LaPenna",
        email: "Bobby.LaPenna@BedfordTX.gov",
        phone: "8179522405",
        company: "Bedford TX Government",
        title: "Deputy Chief of Police",
        location: "Bedford, TX",
        notes: "Law enforcement contact",
        tags: ["JJP", "Lead", "Law Enforcement"],
        leadScore: 75
      },
      {
        name: "Vance Green",
        email: "vance@agsim.com",
        phone: "4099391394",
        company: "AgSim",
        title: "",
        location: "Texas",
        notes: "AgSim company contact",
        tags: ["JJP", "Lead", "AgTech"],
        leadScore: 70
      },
      {
        name: "Strickland James",
        email: "pjpstrickland@yahoo.com",
        phone: "9798455555",
        company: "Yahoo",
        title: "",
        location: "Unknown",
        notes: "Yahoo contact",
        tags: ["JJP", "Lead"],
        leadScore: 60
      },
      {
        name: "Dr. Marino-Hewlette-Woodmere",
        email: "noemail+5167924800@jjpsolutions.com",
        phone: "5167924800",
        company: "Unknown Company",
        title: "",
        location: "Long Island, NY",
        notes: "Long Island area contact",
        tags: ["JJP", "Lead"],
        leadScore: 50
      },
      {
        name: "Upper Sandusky",
        email: "noemail+4192942306@jjpsolutions.com",
        phone: "4192942306",
        company: "Unknown Company",
        title: "",
        location: "Ohio",
        notes: "Ohio area contact",
        tags: ["JJP", "Lead"],
        leadScore: 50
      },
      {
        name: "Ryan Bona",
        email: "noemail+9792095454@jjpsolutions.com",
        phone: "9792095454",
        company: "Unknown Company",
        title: "",
        location: "College Station, TX",
        notes: "College Station area contact",
        tags: ["JJP", "Lead"],
        leadScore: 50
      },
      {
        name: "Bryan Thigpin",
        email: "noemail+9798452345@jjpsolutions.com",
        phone: "9798452345",
        company: "University",
        title: "",
        location: "Bryan, TX",
        notes: "University contact",
        tags: ["JJP", "Lead", "University"],
        leadScore: 50
      },
      {
        name: "Dalton Nichols",
        email: "noemail+9792608000@jjpsolutions.com",
        phone: "9792608000",
        company: "Unknown Company",
        title: "",
        location: "Bryan, TX",
        notes: "Bryan area contact",
        tags: ["JJP", "Lead"],
        leadScore: 50
      },
      {
        name: "Marlo Kruse",
        email: "noemail+9037575777@jjpsolutions.com",
        phone: "9037575777",
        company: "Unknown Company",
        title: "",
        location: "Tyler, TX",
        notes: "Tyler area contact",
        tags: ["JJP", "Lead"],
        leadScore: 50
      },
      {
        name: "Korey Kornoley",
        email: "noemail+4084296464@jjpsolutions.com",
        phone: "4084296464",
        company: "Unknown Company",
        title: "",
        location: "San Jose, CA",
        notes: "San Jose area contact",
        tags: ["JJP", "Lead"],
        leadScore: 50
      },
      {
        name: "Chad Adcox",
        email: "noemail+4094660024@jjpsolutions.com",
        phone: "4094660024",
        company: "Unknown Company",
        title: "",
        location: "Beaumont, TX",
        notes: "Beaumont area contact",
        tags: ["JJP", "Lead"],
        leadScore: 50
      },
      {
        name: "Steven Murphy",
        email: "noemail+9794508000@jjpsolutions.com",
        phone: "9794508000",
        company: "Car Dealership",
        title: "",
        location: "Bryan, TX",
        notes: "Car dealership contact",
        tags: ["JJP", "Lead", "Automotive"],
        leadScore: 55
      }
    ];

    try {
      let imported = 0;
      
      for (const contact of JJP_CONTACTS) {
        try {
          // Import to contacts table
          const { error: contactError } = await supabase
            .from('contacts')
            .insert({
              name: contact.name,
              email: contact.email,
              company: contact.company,
              subject: `Imported Contact - ${contact.title || 'Lead'}`,
              message: `Imported from Monday.com\n${contact.notes}\nLocation: ${contact.location}`,
              status: 'new',
              priority: contact.leadScore > 70 ? 'high' : 'normal',
              tags: contact.tags,
              lead_score: contact.leadScore,
              custom_fields: {
                phone: contact.phone,
                title: contact.title,
                location: contact.location,
                original_status: 'Lead'
              }
            });

          if (!contactError) {
            // Also import to leads table 
            const nameParts = contact.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            await supabase
              .from('leads')
              .insert({
                email: contact.email,
                first_name: firstName,
                last_name: lastName,
                phone: contact.phone,
                company: contact.company,
                lead_status: 'new',
                qualification_status: contact.leadScore > 70 ? 'qualified' : 'unqualified',
                lead_score: contact.leadScore,
                tags: contact.tags,
                notes: `${contact.title ? `Title: ${contact.title}\n` : ''}${contact.location ? `Location: ${contact.location}\n` : ''}${contact.notes}`,
                custom_fields: {
                  title: contact.title,
                  location: contact.location,
                  original_status: 'Lead'
                }
              });

            imported++;
          }
        } catch (error) {
          console.error('Error importing contact:', contact.name, error);
        }
      }

      if (imported > 0) {
        toast({
          title: 'Welcome to JJP Solutions!',
          description: `Successfully imported ${imported} JJP contacts into your CRM`,
          duration: 5000,
        });
        
        // Refresh the contacts list
        setTimeout(() => {
          fetchContacts();
        }, 1000);
      }
    } catch (error) {
      console.error('Auto-import failed:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const contactsData = data || [];
      setContacts(contactsData);
      
      // Auto-import if no contacts exist and user hasn't dismissed auto-import
      if (contactsData.length === 0) {
        const autoImportDismissed = localStorage.getItem('jjp_auto_import_dismissed');
        if (!autoImportDismissed) {
          // Show a helpful message that import is available
          setTimeout(() => {
            toast({
              title: "No contacts found",
              description: "Click 'Import JJP Contacts Now' to load your contact data",
              duration: 8000,
            });
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportComplete = () => {
    // Refresh contacts after import
    fetchContacts();
    setShowImportDialog(false);
    toast({
      title: "Import complete",
      description: "Contacts have been imported successfully",
    });
  };

  const updateContactStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setContacts(contacts.map(contact => 
        contact.id === id ? { ...contact, status } : contact
      ));

      toast({
        title: "Status updated",
        description: "Contact status has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact status",
        variant: "destructive",
      });
    }
  };

  const sendEmail = async () => {
    try {
      const response = await supabase.functions.invoke('send-email', {
        body: {
          to: emailForm.to,
          subject: emailForm.subject,
          text: emailForm.message,
          from: "JJP Solutions <admin@jjpsolutions.com>",
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Email sent",
        description: "Email has been sent successfully",
      });

      setEmailForm({ to: "", subject: "", message: "" });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.custom_fields?.phone?.includes(searchTerm) ||
                         contact.custom_fields?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Contact Management</h1>
        <p className="text-muted-foreground">
          Manage contact form submissions and customer communications.
        </p>
      </div>

      {/* Contact Statistics */}
      <ContactStats />

      {/* Filters and Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Submissions
              </CardTitle>
              <CardDescription>
                Total contacts: {filteredContacts.length}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <DirectImportJJPContacts onImportComplete={fetchContacts} />
              
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Contacts
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Import Contacts</DialogTitle>
                    <DialogDescription>
                      Import contacts from CSV or JSON files
                    </DialogDescription>
                  </DialogHeader>
                  <ContactImporter onImportComplete={handleImportComplete} />
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Email</DialogTitle>
                  <DialogDescription>
                    Send a custom email to a contact or customer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-to">To</Label>
                    <Input
                      id="email-to"
                      placeholder="recipient@example.com"
                      value={emailForm.to}
                      onChange={(e) => setEmailForm({...emailForm, to: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      placeholder="Email subject"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-message">Message</Label>
                    <Textarea
                      id="email-message"
                      placeholder="Email message..."
                      rows={5}
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                    />
                  </div>
                  <Button onClick={sendEmail} className="w-full bg-gradient-primary hover:opacity-90">
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <div className="grid gap-4">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-lg">{contact.name}</h3>
                    <Badge className={getStatusColor(contact.status)}>
                      {contact.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(contact.priority)}>
                      {contact.priority}
                    </Badge>
                    {contact.lead_score && contact.lead_score > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Score: {contact.lead_score}
                      </Badge>
                    )}
                    {contact.tags && contact.tags.length > 0 && (
                      contact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span><strong>Email:</strong> {contact.email}</span>
                    </div>
                    {contact.custom_fields?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span><strong>Phone:</strong> {contact.custom_fields.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span><strong>Company:</strong> {contact.company || 'Not specified'}</span>
                    </div>
                    {contact.custom_fields?.title && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span><strong>Title:</strong> {contact.custom_fields.title}</span>
                      </div>
                    )}
                    {contact.custom_fields?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span><strong>Location:</strong> {contact.custom_fields.location}</span>
                      </div>
                    )}
                    <p><strong>Subject:</strong> {contact.subject}</p>
                    <p><strong>Submitted:</strong> {new Date(contact.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{contact.message}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Select
                    value={contact.status}
                    onValueChange={(value) => updateContactStatus(contact.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailForm({
                        to: contact.email,
                        subject: `Re: ${contact.subject}`,
                        message: `Dear ${contact.name},\n\nThank you for contacting JJP Solutions...\n\nBest regards,\nJJP Solutions Team`,
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredContacts.length === 0 && (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                {contacts.length === 0 
                  ? "No contact submissions yet." 
                  : "No contacts match your current filters."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}