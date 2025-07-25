import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Database, TrendingUp, Phone } from 'lucide-react';

interface ContactStatsData {
  totalContacts: number;
  totalLeads: number;
  contactsWithEmail: number;
  contactsWithPhone: number;
  highScoreContacts: number;
  uniqueCompanies: number;
}

export function ContactStats() {
  const [stats, setStats] = useState<ContactStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get contacts count
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      // Get leads count
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Get contacts with real emails (not placeholder)
      const { count: contactsWithEmail } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('email', 'like', 'noemail+%@jjpsolutions.com');

      // Get contacts with phone numbers
      const { count: contactsWithPhone } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('custom_fields->phone', 'is', null);

      // Get high-score contacts (score > 70)
      const { count: highScoreContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gt('lead_score', 70);

      // Get unique companies
      const { data: companies } = await supabase
        .from('contacts')
        .select('company')
        .not('company', 'is', null)
        .not('company', 'eq', 'Unknown Company');

      const uniqueCompanies = new Set(companies?.map(c => c.company)).size;

      setStats({
        totalContacts: totalContacts || 0,
        totalLeads: totalLeads || 0,
        contactsWithEmail: contactsWithEmail || 0,
        contactsWithPhone: contactsWithPhone || 0,
        highScoreContacts: highScoreContacts || 0,
        uniqueCompanies
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading stats...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">{stats.totalContacts}</div>
          <div className="text-xs text-muted-foreground">Total Contacts</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Database className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold">{stats.totalLeads}</div>
          <div className="text-xs text-muted-foreground">Total Leads</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Badge variant="outline" className="text-xs">@</Badge>
          </div>
          <div className="text-2xl font-bold">{stats.contactsWithEmail}</div>
          <div className="text-xs text-muted-foreground">With Email</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Phone className="h-8 w-8 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">{stats.contactsWithPhone}</div>
          <div className="text-xs text-muted-foreground">With Phone</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
          <div className="text-2xl font-bold">{stats.highScoreContacts}</div>
          <div className="text-xs text-muted-foreground">High Score</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Badge variant="secondary" className="text-xs">CO</Badge>
          </div>
          <div className="text-2xl font-bold">{stats.uniqueCompanies}</div>
          <div className="text-xs text-muted-foreground">Companies</div>
        </CardContent>
      </Card>
    </div>
  );
}