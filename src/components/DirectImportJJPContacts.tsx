import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JJP_CONTACTS } from '@/data/jjpContacts';
import { Download, Loader2, CheckCircle } from 'lucide-react';

interface DirectImportJJPContactsProps {
  onImportComplete?: () => void;
}

export function DirectImportJJPContacts({ onImportComplete }: DirectImportJJPContactsProps) {
  const [importing, setImporting] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  const { toast } = useToast();

  // JJP_CONTACTS is now imported from shared data file

  const handleDirectImport = async () => {
    setImporting(true);
    
    try {
      let imported = 0;
      let duplicates = 0;
      let failed = 0;

      for (const contact of JJP_CONTACTS) {
        try {
          // Check for existing contact by email
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', contact.email)
            .single();

          if (existingContact) {
            duplicates++;
            continue;
          }

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

          if (contactError) {
            console.error('Contact import error:', contactError);
            failed++;
            continue;
          }

          // Also import to leads table
          const nameParts = contact.name.trim().split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');

          const { error: leadError } = await supabase
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

          if (leadError) {
            console.error('Lead import error:', leadError);
            // Don't count as failed if contact was successful
          }

          imported++;
        } catch (error) {
          console.error('Error importing contact:', contact.name, error);
          failed++;
        }
      }

      setImportCompleted(true);
      
      toast({
        title: 'JJP Contacts Imported Successfully!',
        description: `Imported ${imported} contacts, ${duplicates} duplicates skipped, ${failed} failed`,
        duration: 5000,
      });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      console.error('Direct import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import JJP contacts',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  if (importCompleted) {
    return (
      <Button disabled variant="outline" className="gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        JJP Contacts Imported
      </Button>
    );
  }

  return (
    <Button
      onClick={handleDirectImport}
      disabled={importing}
      className="gap-2 bg-gradient-primary hover:opacity-90"
    >
      {importing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {importing ? 'Importing JJP Contacts...' : 'Import JJP Contacts Now'}
    </Button>
  );
}