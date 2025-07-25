import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { Search, Mail, Calendar, Crown, Shield, User, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  pre_assigned_role: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  invited_by: string;
  metadata: any;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

const statusColors = {
  pending: 'default',
  accepted: 'default',
  expired: 'secondary',
  cancelled: 'destructive',
} as const;

const roleIcons = {
  admin: Crown,
  moderator: Shield,
  user: User,
};

const roleColors = {
  admin: 'destructive',
  moderator: 'secondary',
  user: 'default',
} as const;

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invitations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      // This would need a separate edge function to resend invitations
      toast({
        title: 'Feature Coming Soon',
        description: 'Resend invitation functionality will be available soon.',
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend invitation.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation cancelled.',
      });

      fetchInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation.',
        variant: 'destructive',
      });
    }
  };

  const filteredInvitations = invitations.filter((invitation) => {
    const matchesSearch = 
      invitation.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
    const matchesRole = roleFilter === 'all' || invitation.pre_assigned_role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusText = (status: string, expiresAt: string) => {
    if (status === 'pending' && new Date(expiresAt) < new Date()) {
      return 'expired';
    }
    return status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
            <CardDescription>Loading invitations...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                User Invitations
              </CardTitle>
              <CardDescription>
                Manage user invitations and track their status
              </CardDescription>
            </div>
            <InviteUserDialog onInviteSent={fetchInvitations} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => {
                  const actualStatus = getStatusText(invitation.status, invitation.expires_at);
                  const RoleIcon = roleIcons[invitation.pre_assigned_role as keyof typeof roleIcons];
                  const inviterName = 'Admin';
                  
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invitation.email}</div>
                          {invitation.metadata?.personal_message && (
                            <div className="text-sm text-muted-foreground italic">
                              "{invitation.metadata.personal_message}"
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleColors[invitation.pre_assigned_role as keyof typeof roleColors]} className="flex items-center gap-1 w-fit">
                          <RoleIcon className="h-3 w-3" />
                          {invitation.pre_assigned_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[actualStatus as keyof typeof statusColors]}>
                          {actualStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{inviterName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {actualStatus === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvitation(invitation.id)}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Resend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredInvitations.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No invitations found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}