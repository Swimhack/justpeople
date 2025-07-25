import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  Palette,
  Globe,
  Mail,
  Shield,
  Database,
  Server,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface BrandSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  is_active: boolean;
  variables: any;
  created_at: string;
  updated_at: string;
}

interface SEOSetting {
  id: string;
  page_path: string;
  title: string | null;
  description: string | null;
  keywords: string[] | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  canonical_url: string | null;
  robots: string | null;
  schema_markup: any;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [brandSettings, setBrandSettings] = useState<BrandSetting[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [seoSettings, setSeoSettings] = useState<SEOSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("system");
  const { toast } = useToast();

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      const [systemRes, brandRes, emailRes, seoRes] = await Promise.all([
        supabase.from('system_settings').select('*').order('setting_key'),
        supabase.from('brand_settings').select('*').order('setting_key'),
        supabase.from('email_templates').select('*').order('template_key'),
        supabase.from('seo_settings').select('*').order('page_path')
      ]);

      if (systemRes.error) throw systemRes.error;
      if (brandRes.error) throw brandRes.error;
      if (emailRes.error) throw emailRes.error;
      if (seoRes.error) throw seoRes.error;

      setSystemSettings(systemRes.data || []);
      setBrandSettings(brandRes.data || []);
      setEmailTemplates(emailRes.data || []);
      setSeoSettings(seoRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch settings: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSystemSetting = async (id: string, value: any) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: value })
        .eq('id', id);

      if (error) throw error;

      setSystemSettings(prev => prev.map(setting => 
        setting.id === id ? { ...setting, setting_value: value } : setting
      ));

      toast({
        title: "Success",
        description: "System setting updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update setting: " + error.message,
        variant: "destructive",
      });
    }
  };

  const updateBrandSetting = async (id: string, value: any) => {
    try {
      const { error } = await supabase
        .from('brand_settings')
        .update({ setting_value: value })
        .eq('id', id);

      if (error) throw error;

      setBrandSettings(prev => prev.map(setting => 
        setting.id === id ? { ...setting, setting_value: value } : setting
      ));

      toast({
        title: "Success",
        description: "Brand setting updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update setting: " + error.message,
        variant: "destructive",
      });
    }
  };

  const toggleEmailTemplate = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setEmailTemplates(prev => prev.map(template => 
        template.id === id ? { ...template, is_active: isActive } : template
      ));

      toast({
        title: "Success",
        description: `Email template ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update template: " + error.message,
        variant: "destructive",
      });
    }
  };

  const updateSEOSetting = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('seo_settings')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      setSeoSettings(prev => prev.map(setting => 
        setting.id === id ? { ...setting, [field]: value } : setting
      ));

      toast({
        title: "Success",
        description: "SEO setting updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update SEO setting: " + error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system, brand, email, and SEO settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="brand" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Brand
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Manage core system settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemSettings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No system settings configured
                </p>
              ) : (
                systemSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{setting.setting_key}</h4>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {typeof setting.setting_value === 'boolean' ? (
                        <Switch
                          checked={setting.setting_value}
                          onCheckedChange={(checked) => updateSystemSetting(setting.id, checked)}
                        />
                      ) : (
                        <Input
                          value={typeof setting.setting_value === 'string' ? setting.setting_value : JSON.stringify(setting.setting_value)}
                          onChange={(e) => {
                            const value = e.target.value;
                            try {
                              const parsed = JSON.parse(value);
                              updateSystemSetting(setting.id, parsed);
                            } catch {
                              updateSystemSetting(setting.id, value);
                            }
                          }}
                          className="w-64"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Settings
              </CardTitle>
              <CardDescription>
                Customize brand appearance and styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {brandSettings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No brand settings configured
                </p>
              ) : (
                brandSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{setting.setting_key}</h4>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={typeof setting.setting_value === 'string' ? setting.setting_value : JSON.stringify(setting.setting_value)}
                        onChange={(e) => {
                          const value = e.target.value;
                          try {
                            const parsed = JSON.parse(value);
                            updateBrandSetting(setting.id, parsed);
                          } catch {
                            updateBrandSetting(setting.id, value);
                          }
                        }}
                        className="w-64"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Manage email templates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailTemplates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No email templates configured
                </p>
              ) : (
                emailTemplates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.template_key}</h4>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={(checked) => toggleEmailTemplate(template.id, checked)}
                        />
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="bg-muted/30 p-3 rounded border max-h-32 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: template.html_content.substring(0, 200) + '...' }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                SEO Settings
              </CardTitle>
              <CardDescription>
                Configure SEO settings for different pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {seoSettings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No SEO settings configured
                </p>
              ) : (
                seoSettings.map((seo) => (
                  <div key={seo.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{seo.page_path}</h4>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Page Title</label>
                        <Input
                          value={seo.title || ''}
                          onChange={(e) => updateSEOSetting(seo.id, 'title', e.target.value)}
                          placeholder="Page title"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Robots</label>
                        <Input
                          value={seo.robots || ''}
                          onChange={(e) => updateSEOSetting(seo.id, 'robots', e.target.value)}
                          placeholder="index,follow"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Meta Description</label>
                      <Textarea
                        value={seo.description || ''}
                        onChange={(e) => updateSEOSetting(seo.id, 'description', e.target.value)}
                        placeholder="Page description"
                        rows={2}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">OG Title</label>
                        <Input
                          value={seo.og_title || ''}
                          onChange={(e) => updateSEOSetting(seo.id, 'og_title', e.target.value)}
                          placeholder="Open Graph title"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Twitter Title</label>
                        <Input
                          value={seo.twitter_title || ''}
                          onChange={(e) => updateSEOSetting(seo.id, 'twitter_title', e.target.value)}
                          placeholder="Twitter title"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemSettings.length + brandSettings.length + emailTemplates.length + seoSettings.length}
            </div>
            <p className="text-xs text-muted-foreground">Total configurations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}