import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2 } from 'lucide-react';

interface ImportJJPContactsButtonProps {
  onImportComplete?: () => void;
}

export function ImportJJPContactsButton({ onImportComplete }: ImportJJPContactsButtonProps) {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-jjp-contacts', {
        body: {}
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Import Successful',
        description: `Imported ${data.stats.imported} contacts, ${data.stats.duplicates} duplicates skipped, ${data.stats.failed} failed`,
      });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import JJP contacts',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Button
      onClick={handleImport}
      disabled={importing}
      variant="outline"
      className="gap-2"
    >
      {importing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {importing ? 'Importing...' : 'Import JJP Contacts'}
    </Button>
  );
}