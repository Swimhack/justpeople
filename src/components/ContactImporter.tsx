import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ContactImportData {
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  location: string;
  notes: string;
  tags: string[];
  status: string;
}

interface ImportStats {
  total: number;
  imported: number;
  failed: number;
  duplicates: number;
}

interface ContactImporterProps {
  onImportComplete?: () => void;
}

export default function ContactImporter({ onImportComplete }: ContactImporterProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const parseCSV = (csvText: string): ContactImportData[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const contacts: ContactImportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const contact: Partial<ContactImportData> = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header.toLowerCase()) {
          case 'name':
            contact.name = value;
            break;
          case 'email':
            contact.email = value;
            break;
          case 'phone':
            contact.phone = value;
            break;
          case 'company':
            contact.company = value;
            break;
          case 'title':
            contact.title = value;
            break;
          case 'location':
            contact.location = value;
            break;
          case 'notes':
            contact.notes = value;
            break;
          case 'tags':
            contact.tags = value ? value.split(',').map(t => t.trim()) : [];
            break;
          case 'status':
            contact.status = value || 'Lead';
            break;
        }
      });

      if (contact.name && contact.email) {
        contacts.push(contact as ContactImportData);
      }
    }

    return contacts;
  };

  const parseJSON = (jsonText: string): ContactImportData[] => {
    try {
      const data = JSON.parse(jsonText);
      const contacts: ContactImportData[] = [];

      const processContact = (item: any): ContactImportData | null => {
        if (!item.name || !item.email) return null;

        return {
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          company: item.company || 'Unknown Company',
          title: item.title || '',
          location: item.location || '',
          notes: item.notes || '',
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : ['JJP', 'Lead']),
          status: item.status || 'Lead'
        };
      };

      if (Array.isArray(data)) {
        data.forEach(item => {
          const contact = processContact(item);
          if (contact) contacts.push(contact);
        });
      } else if (data.name && data.email) {
        const contact = processContact(data);
        if (contact) contacts.push(contact);
      }

      return contacts;
    } catch (error) {
      console.error('JSON parse error:', error);
      return [];
    }
  };

  const splitName = (fullName: string): { firstName: string; lastName: string } => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  };

  const importContacts = async (contacts: ContactImportData[]) => {
    const stats: ImportStats = { total: contacts.length, imported: 0, failed: 0, duplicates: 0 };
    setImportStats(stats);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      setProgress((i / contacts.length) * 100);

      try {
        // Skip contacts with unknown or empty emails
        if (!contact.email || contact.email.toLowerCase() === 'unknown' || contact.email.trim() === '') {
          // For contacts without email, use phone as unique identifier
          if (!contact.phone) {
            stats.failed++;
            continue;
          }
          
          // Check for existing contact/lead by phone
          const { data: existingContactByPhone } = await supabase
            .from('contacts')
            .select('id')
            .eq('custom_fields->phone', contact.phone)
            .single();

          const { data: existingLeadByPhone } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', contact.phone)
            .single();

          if (existingContactByPhone || existingLeadByPhone) {
            stats.duplicates++;
            continue;
          }
          
          // Create email placeholder for database requirement
          contact.email = `noemail+${contact.phone}@jjpsolutions.com`;
        } else {
          // Check for existing contact/lead by email
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', contact.email)
            .single();

          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('email', contact.email)
            .single();

          if (existingContact || existingLead) {
            stats.duplicates++;
            continue;
          }
        }

        const { firstName, lastName } = splitName(contact.name);

        // Import as lead (primary CRM table)
        const { error: leadError } = await supabase
          .from('leads')
          .insert({
            email: contact.email,
            first_name: firstName,
            last_name: lastName,
            phone: contact.phone,
            company: contact.company,
            lead_status: 'new',
            qualification_status: 'unqualified',
            lead_score: 50, // Default lead score
            tags: contact.tags,
            notes: `${contact.title ? `Title: ${contact.title}\n` : ''}${contact.location ? `Location: ${contact.location}\n` : ''}${contact.notes}`,
            custom_fields: {
              title: contact.title,
              location: contact.location,
              original_status: contact.status
            }
          });

        if (leadError) {
          console.error('Lead import error:', leadError);
          stats.failed++;
          continue;
        }

        // Also import to contacts table for contact management
        const { error: contactError } = await supabase
          .from('contacts')
          .insert({
            name: contact.name,
            email: contact.email,
            company: contact.company,
            subject: `Imported Contact - ${contact.title || 'Lead'}`,
            message: `Imported from Monday.com\n${contact.notes}\nLocation: ${contact.location}`,
            status: 'new',
            priority: 'normal',
            tags: contact.tags,
            lead_score: 50,
            custom_fields: {
              phone: contact.phone,
              title: contact.title,
              location: contact.location,
              original_status: contact.status
            }
          });

        if (contactError) {
          console.error('Contact import error:', contactError);
          // Don't fail the import if contact creation fails, lead was successful
        }

        stats.imported++;
      } catch (error) {
        console.error('Import error for contact:', contact.email, error);
        stats.failed++;
      }

      // Update stats
      setImportStats({ ...stats });
    }

    setProgress(100);
    return stats;
  };

  const handleImport = async () => {
    if (!csvFile && !jsonFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV or JSON file to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      let contacts: ContactImportData[] = [];

      if (csvFile) {
        const csvText = await csvFile.text();
        contacts = parseCSV(csvText);
      } else if (jsonFile) {
        const jsonText = await jsonFile.text();
        contacts = parseJSON(jsonText);
      }

      if (contacts.length === 0) {
        toast({
          title: "No valid contacts found",
          description: "The file doesn't contain valid contact data",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      const finalStats = await importContacts(contacts);

      toast({
        title: "Import completed",
        description: `Imported ${finalStats.imported} contacts, ${finalStats.duplicates} duplicates skipped, ${finalStats.failed} failed`,
      });

      // Call the callback to refresh the contacts list
      if (onImportComplete) {
        onImportComplete();
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'json') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'csv') {
      setCsvFile(file);
      setJsonFile(null);
    } else {
      setJsonFile(file);
      setCsvFile(null);
    }
    setImportStats(null);
    setProgress(0);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Contact Importer
        </CardTitle>
        <CardDescription>
          Import contacts from Monday.com CSV or JSON files into the CRM system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File (JJP_CONTACTS_LOVABLE_IMPORT.csv)</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e, 'csv')}
              disabled={importing}
            />
            {csvFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <FileText className="h-4 w-4" />
                {csvFile.name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="json-file">JSON File (JJP_CONTACTS_LOVABLE_IMPORT.json)</Label>
            <Input
              id="json-file"
              type="file"
              accept=".json"
              onChange={(e) => handleFileChange(e, 'json')}
              disabled={importing}
            />
            {jsonFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <FileText className="h-4 w-4" />
                {jsonFile.name}
              </div>
            )}
          </div>
        </div>

        {importing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Importing contacts...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {importStats && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{importStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{importStats.imported}</div>
                  <div className="text-xs text-muted-foreground">Imported</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{importStats.duplicates}</div>
                  <div className="text-xs text-muted-foreground">Duplicates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button 
            onClick={handleImport} 
            disabled={(!csvFile && !jsonFile) || importing}
            className="flex-1"
          >
            {importing ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Supported fields:</strong> name, email, phone, company, title, location, notes, tags, status</p>
          <p><strong>Required fields:</strong> name, email</p>
          <p>Contacts will be imported as leads in the CRM system with proper field mapping.</p>
        </div>
      </CardContent>
    </Card>
  );
}