import React, { useState } from 'react';
import { Download, Upload, Trash2, FileText, Database, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useJarvisLocal } from '@/hooks/useJarvisLocal';
import { useToast } from '@/hooks/use-toast';

export const DataManager: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  
  const { exportData, importData, getStats } = useJarvisLocal();
  const { toast } = useToast();

  // Load storage info on component mount
  React.useEffect(() => {
    const loadStorageInfo = async () => {
      const stats = await getStats();
      setStorageInfo(stats);
    };
    loadStorageInfo();
  }, [getStats]);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jarvis-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export successful",
          description: "Your JARVIS data has been exported as JSON",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportText = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      if (data) {
        let textContent = `JARVIS Data Export - ${new Date().toLocaleString()}\n`;
        textContent += "=" .repeat(50) + "\n\n";
        
        // Export conversations
        textContent += "CONVERSATIONS:\n";
        textContent += "-".repeat(20) + "\n";
        data.conversations.forEach((conv, index) => {
          textContent += `${index + 1}. ${conv.title} (${conv.category})\n`;
          textContent += `   Created: ${new Date(conv.created_at).toLocaleString()}\n`;
          textContent += `   Messages: ${conv.messages.length}\n`;
          textContent += `   Tags: ${conv.tags.join(', ')}\n\n`;
          
          conv.messages.forEach(msg => {
            textContent += `   ${msg.role.toUpperCase()}: ${msg.content}\n`;
            textContent += `   Time: ${new Date(msg.timestamp).toLocaleString()}\n\n`;
          });
          textContent += "\n";
        });
        
        // Export memories
        textContent += "\nMEMORIES:\n";
        textContent += "-".repeat(20) + "\n";
        data.memories.forEach((memory, index) => {
          textContent += `${index + 1}. [${memory.category}] ${memory.content}\n`;
          textContent += `   Timestamp: ${new Date(memory.timestamp).toLocaleString()}\n`;
          textContent += `   Tags: ${memory.tags.join(', ')}\n\n`;
        });

        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jarvis-export-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export successful",
          description: "Your JARVIS data has been exported as text",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const success = await importData(data);
      if (success) {
        toast({
          title: "Import successful",
          description: "Your JARVIS data has been imported",
        });
        
        // Refresh storage info
        const stats = await getStats();
        setStorageInfo(stats);
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import the selected file. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{storageInfo.totalConversations}</div>
                <div className="text-sm text-muted-foreground">Conversations</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{storageInfo.totalMemories}</div>
                <div className="text-sm text-muted-foreground">Memories</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{storageInfo.totalMessages}</div>
                <div className="text-sm text-muted-foreground">Messages</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{formatBytes(storageInfo.storageUsed)}</div>
                <div className="text-sm text-muted-foreground">Storage Used</div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Local Database Usage</span>
              <span>{storageInfo ? formatBytes(storageInfo.storageUsed) : '0 Bytes'}</span>
            </div>
            <Progress value={35} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Estimated storage usage (IndexedDB has no strict limits)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export your JARVIS conversations and memories for backup or transfer to another device.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleExportJSON}
              disabled={isExporting}
              variant="default"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export as JSON'}
            </Button>
            
            <Button 
              onClick={handleExportText}
              disabled={isExporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export as Text'}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• JSON format: Full backup with all data and metadata</p>
            <p>• Text format: Human-readable conversation export</p>
          </div>
        </CardContent>
      </Card>

      {/* Import Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Import JARVIS data from a previous export. This will merge with your existing data.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="import-file">Select JSON backup file</Label>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          
          {isImporting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Importing data...
            </div>
          )}
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Only JSON files from JARVIS exports are supported</p>
            <p>• Existing data will not be overwritten</p>
            <p>• Duplicate conversations will be skipped</p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage your local JARVIS data storage and cleanup options.
          </p>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                toast({
                  title: "Feature coming soon",
                  description: "Advanced cleanup options will be available in the next update",
                });
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clean up old conversations (&gt;30 days)
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                toast({
                  title: "Feature coming soon",
                  description: "Data optimization tools will be available in the next update",
                });
              }}
            >
              <Database className="h-4 w-4 mr-2" />
              Optimize database storage
            </Button>
          </div>
          
          <Separator />
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Data is stored locally in your browser&apos;s IndexedDB</p>
            <p>• No data is sent to external servers</p>
            <p>• Regular backups are recommended</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};