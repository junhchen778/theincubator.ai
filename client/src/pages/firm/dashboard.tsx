import { Navigation } from '@/components/navigation';
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  type FirmPipelineCompany,
  type FirmActivityWithDetails,
  type FirmMemberWithUser,
  type VCFirm,
  type InvestmentThesis,
  FIRM_TAGS,
  STAGE_DISPLAY_NAMES,
  STAGES,
  SECTORS,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Building2,
  Users,
  TrendingUp,
  Settings,
  ExternalLink,
  UserPlus,
  FileText,
  Tag,
  Calendar,
  Trash2,
  Mail,
  Shield,
  UserMinus,
  Edit,
  Star,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileUpload } from '@/components/file-upload';
import { formatDistanceToNow } from 'date-fns';

export default function FirmDashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [firm, setFirm] = useState<VCFirm | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamMembers, setTeamMembers] = useState<FirmMemberWithUser[]>([]);
  const [stats, setStats] = useState({
    companiesTracking: 0,
    teamMembers: 0,
    interestsExpressed: 0,
  });
  const [pipelineCompanies, setPipelineCompanies] = useState<FirmPipelineCompany[]>([]);
  const [activities, setActivities] = useState<FirmActivityWithDetails[]>([]);
  const [selectedTab, setSelectedTab] = useState('pipeline');

  // Filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all');

  // Pagination
  const [pipelinePage, setPipelinePage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const itemsPerPage = 20;
  const activitiesPerPage = 50;

  // Firm profile form
  const [firmName, setFirmName] = useState('');
  const [firmWebsite, setFirmWebsite] = useState('');
  const [firmLogo, setFirmLogo] = useState('');
  const [investmentThesis, setInvestmentThesis] = useState<InvestmentThesis>({
    stages: [],
    sectors: [],
    geography: '',
    check_size: '',
  });

  // Team management
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    checkFirmMembership();
  }, []);

  useEffect(() => {
    if (firm) {
      loadPipelineCompanies();
    }
  }, [firm, selectedTags, selectedAssignee, selectedStages, selectedSectors]);

  useEffect(() => {
    if (firm && selectedTab === 'activity') {
      loadTeamActivity();
    }
  }, [firm, selectedTab, activityFilter]);

  async function checkFirmMembership() {
    // Get current user
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setLocation('/auth/sign-in');
      return;
    }

    setUser(currentUser);

    // Check if user is a firm member
    const { data: membership, error: memberError } = await supabase
      .from('firm_members')
      .select('*, vc_firms(*)')
      .eq('user_id', currentUser.id)
      .single();

    if (memberError || !membership) {
      toast({
        title: 'Access Denied',
        description: 'You must be a member of a VC firm to access this page.',
        variant: 'destructive',
      });
      setLocation('/feed');
      return;
    }

    setFirm(membership.vc_firms as VCFirm);
    setIsAdmin(membership.role === 'admin');

    // Initialize firm profile form
    setFirmName(membership.vc_firms.name);
    setFirmWebsite(membership.vc_firms.website || '');
    setFirmLogo(membership.vc_firms.logo_url || '');
    
    const thesis = membership.vc_firms.investment_thesis;
    if (thesis && typeof thesis === 'object' && !Array.isArray(thesis)) {
      setInvestmentThesis(thesis as unknown as InvestmentThesis);
    }

    // Load team members
    const { data: members } = await supabase
      .from('firm_members')
      .select('*, user:users(*)')
      .eq('firm_id', membership.vc_firms.id);

    if (members) {
      setTeamMembers(
        members.map((m: any) => ({
          ...m,
          user: m.user,
        }))
      );
    }

    // Load stats
    await loadStats(membership.vc_firms.id);

    setLoading(false);
  }

  async function loadStats(firmId: string) {
    // Count companies tracking
    const { count: followCount } = await supabase
      .from('company_follows')
      .select('*', { count: 'exact', head: true })
      .eq('firm_id', firmId);

    // Count team members
    const { count: memberCount } = await supabase
      .from('firm_members')
      .select('*', { count: 'exact', head: true })
      .eq('firm_id', firmId);

    // Count interests expressed by firm
    const { count: interestCount } = await supabase
      .from('company_interests')
      .select('*', { count: 'exact', head: true })
      .eq('firm_id', firmId);

    setStats({
      companiesTracking: followCount || 0,
      teamMembers: memberCount || 0,
      interestsExpressed: interestCount || 0,
    });
  }

  async function loadPipelineCompanies() {
    if (!firm) return;

    // Get all companies the firm is following
    const { data: follows } = await supabase
      .from('company_follows')
      .select('company_id, created_at')
      .eq('firm_id', firm.id) as { data: any[] | null };

    if (!follows || follows.length === 0) {
      setPipelineCompanies([]);
      return;
    }

    const companyIds = follows.map((f) => f.company_id);

    // Get company details
    const { data: companies } = await supabase
      .from('companies')
      .select(
        `
        *,
        founders:company_founders(*, user:users(*))
      `
      )
      .in('id', companyIds) as { data: any[] | null };

    if (!companies) return;

    // Get latest notes for each company
    const { data: notes } = await supabase
      .from('firm_notes')
      .select('*')
      .eq('firm_id', firm.id)
      .in('company_id', companyIds)
      .order('created_at', { ascending: false }) as { data: any[] | null };

    // Get all assignments for these companies
    const { data: assignments } = await supabase
      .from('company_assignments')
      .select('*, assignee:users!company_assignments_assigned_to_fkey(*)')
      .eq('firm_id', firm.id)
      .in('company_id', companyIds) as { data: any[] | null };

    // Get firm interests for these companies
    const { data: interests } = await supabase
      .from('company_interests')
      .select('company_id')
      .eq('firm_id', firm.id)
      .in('company_id', companyIds) as { data: any[] | null };

    const companyIdsWithInterest = new Set(interests?.map(i => i.company_id) || []);

    // Build pipeline data
    const pipelineData: FirmPipelineCompany[] = companies.map((company: any) => {
      const follow = follows.find((f: any) => f.company_id === company.id);
      const companyNotes = notes?.filter((n: any) => n.company_id === company.id) || [];
      const assignment = assignments?.find((a: any) => a.company_id === company.id);
      
      // Get latest tags from notes
      const latestTags: string[] = [];
      const tagSet = new Set<string>();
      
      for (const note of companyNotes) {
        if (note.tags && note.tags.length > 0) {
          note.tags.forEach((tag: string) => {
            if (!tagSet.has(tag)) {
              tagSet.add(tag);
              latestTags.push(tag);
            }
          });
        }
      }

      // Get assigned_to from company_assignments table
      const assignedTo = (assignment && assignment.assigned_to) ? assignment.assignee : null;

      // Get last activity (most recent note)
      const lastActivity = companyNotes.length > 0 ? companyNotes[0].created_at : null;

      return {
        company: {
          ...company,
          founders: company.founders || [],
        },
        followed_since: follow?.created_at || '',
        latest_tags: latestTags,
        assigned_to: assignedTo,
        last_activity: lastActivity,
        note_count: companyNotes.length,
        has_firm_interest: companyIdsWithInterest.has(company.id),
      };
    });

    // Apply filters
    let filtered = pipelineData;

    if (selectedTags.length > 0) {
      filtered = filtered.filter((pc) =>
        selectedTags.some((tag) => pc.latest_tags.includes(tag))
      );
    }

    if (selectedAssignee === 'me' && user) {
      filtered = filtered.filter((pc) => pc.assigned_to?.id === user.id);
    } else if (selectedAssignee === 'unassigned') {
      filtered = filtered.filter((pc) => !pc.assigned_to);
    } else if (selectedAssignee !== 'all') {
      filtered = filtered.filter((pc) => pc.assigned_to?.id === selectedAssignee);
    }

    if (selectedStages.length > 0) {
      filtered = filtered.filter((pc) => selectedStages.includes(pc.company.stage));
    }

    if (selectedSectors.length > 0) {
      filtered = filtered.filter((pc) =>
        pc.company.sector?.some((s) => selectedSectors.includes(s))
      );
    }

    setPipelineCompanies(filtered);
  }

  async function loadTeamActivity() {
    if (!firm) return;

    let query = supabase
      .from('firm_activity')
      .select(
        `
        *,
        member:users!firm_activity_member_id_fkey(*),
        company:companies(*)
      `
      )
      .eq('firm_id', firm.id)
      .order('created_at', { ascending: false })
      .limit(activitiesPerPage * activityPage);

    if (activityFilter === 'me' && user) {
      query = query.eq('member_id', user.id);
    } else if (activityFilter !== 'all') {
      query = query.eq('member_id', activityFilter);
    }

    const { data } = await query;

    if (data) {
      setActivities(data as any);
    }
  }

  // Firm Profile Management Functions
  async function saveFirmProfile() {
    if (!firm) return;

    if (!firmName.trim()) {
      toast({
        title: 'Error',
        description: 'Firm name is required.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('vc_firms')
      .update({
        name: firmName,
        website: firmWebsite || null,
        logo_url: firmLogo || null,
        investment_thesis: investmentThesis as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', firm.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update firm profile.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Firm profile updated.',
    });

    // Reload firm data
    const { data: updatedFirm } = await supabase
      .from('vc_firms')
      .select()
      .eq('id', firm.id)
      .single();

    if (updatedFirm) {
      setFirm(updatedFirm as VCFirm);
    }
  }

  // Team Management Functions
  async function inviteTeamMember() {
    if (!firm) return;

    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required.',
        variant: 'destructive',
      });
      return;
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select()
      .eq('email', inviteEmail)
      .single();

    if (!existingUser) {
      toast({
        title: 'User Not Found',
        description: 'This user needs to sign up first.',
        variant: 'destructive',
      });
      return;
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('firm_members')
      .select()
      .eq('firm_id', firm.id)
      .eq('user_id', existingUser.id)
      .single();

    if (existingMember) {
      toast({
        title: 'Error',
        description: 'This user is already a member of your firm.',
        variant: 'destructive',
      });
      return;
    }

    // Add member
    const { error } = await supabase.from('firm_members').insert({
      firm_id: firm.id,
      user_id: existingUser.id,
      role: inviteRole,
      title: inviteTitle || null,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add team member.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `${inviteEmail} has been added to your firm.`,
    });

    // Reset form
    setInviteEmail('');
    setInviteTitle('');
    setInviteRole('member');

    // Reload team members
    await loadStats(firm.id);
    const { data: members } = await supabase
      .from('firm_members')
      .select('*, user:users(*)')
      .eq('firm_id', firm.id);

    if (members) {
      setTeamMembers(
        members.map((m: any) => ({
          ...m,
          user: m.user,
        }))
      );
    }
  }

  async function updateMemberTitle(memberId: string) {
    if (!firm) return;

    const { error } = await supabase
      .from('firm_members')
      .update({ title: editTitle })
      .eq('id', memberId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update member title.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Member title updated.',
    });

    setEditingMemberId(null);
    setEditTitle('');
    
    // Reload team members
    const { data: members } = await supabase
      .from('firm_members')
      .select('*, user:users(*)')
      .eq('firm_id', firm.id);

    if (members) {
      setTeamMembers(
        members.map((m: any) => ({
          ...m,
          user: m.user,
        }))
      );
    }
  }

  async function changeRole(memberId: string, newRole: 'admin' | 'member') {
    if (!firm) return;

    const { error } = await supabase
      .from('firm_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to change member role.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `Role changed to ${newRole}.`,
    });

    // Reload team members
    const { data: members } = await supabase
      .from('firm_members')
      .select('*, user:users(*)')
      .eq('firm_id', firm.id);

    if (members) {
      setTeamMembers(
        members.map((m: any) => ({
          ...m,
          user: m.user,
        }))
      );
    }
  }

  async function removeMember(memberId: string) {
    if (!firm) return;

    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;

    // Check if trying to remove self as only admin
    if (member.user_id === user?.id) {
      const adminCount = teamMembers.filter((m) => m.role === 'admin').length;
      if (adminCount === 1) {
        toast({
          title: 'Error',
          description: 'You cannot remove yourself as the only admin.',
          variant: 'destructive',
        });
        return;
      }
    }

    const { error } = await supabase.from('firm_members').delete().eq('id', memberId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `${member.user?.full_name} has been removed from your firm.`,
    });

    setRemoveMemberId(null);
    
    // Reload team members and stats
    await loadStats(firm.id);
    const { data: members } = await supabase
      .from('firm_members')
      .select('*, user:users(*)')
      .eq('firm_id', firm.id);

    if (members) {
      setTeamMembers(
        members.map((m: any) => ({
          ...m,
          user: m.user,
        }))
      );
    }
  }

  async function deleteFirm() {
    if (!firm) return;

    // This will cascade delete all related data
    const { error } = await supabase.from('vc_firms').delete().eq('id', firm.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete firm.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Firm Deleted',
      description: 'Your firm has been permanently deleted.',
    });

    setLocation('/feed');
  }

  async function removeCompanyFromPipeline(companyId: string) {
    if (!firm) return;

    const { error } = await supabase
      .from('company_follows')
      .delete()
      .eq('firm_id', firm.id)
      .eq('company_id', companyId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove company from pipeline.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Company removed from pipeline.',
    });

    loadPipelineCompanies();
    if (firm) loadStats(firm.id);
  }

  function renderActivityItem(activity: FirmActivityWithDetails) {
    const memberName = activity.member?.full_name || 'Unknown';
    const companyName = activity.company?.name || 'Unknown';
    const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

    let icon;
    let text;

    switch (activity.action_type) {
      case 'followed_company':
        icon = <UserPlus className="h-4 w-4" />;
        text = (
          <span>
            <strong>{memberName}</strong> followed <Link to={`/firm/company/${activity.company_id}`} className="text-blue-600 hover:underline">{companyName}</Link>
          </span>
        );
        break;
      case 'added_note':
        icon = <FileText className="h-4 w-4" />;
        text = (
          <span>
            <strong>{memberName}</strong> added note on <Link to={`/firm/company/${activity.company_id}`} className="text-blue-600 hover:underline">{companyName}</Link>
          </span>
        );
        break;
      case 'updated_note':
        icon = <FileText className="h-4 w-4" />;
        text = (
          <span>
            <strong>{memberName}</strong> updated note on <Link to={`/firm/company/${activity.company_id}`} className="text-blue-600 hover:underline">{companyName}</Link>
          </span>
        );
        break;
      case 'tagged_company':
        icon = <Tag className="h-4 w-4" />;
        const tags = activity.metadata?.tags?.join(', ') || '';
        text = (
          <span>
            <strong>{memberName}</strong> tagged <Link to={`/firm/company/${activity.company_id}`} className="text-blue-600 hover:underline">{companyName}</Link> as {tags}
          </span>
        );
        break;
      case 'assigned_deal':
        icon = <Calendar className="h-4 w-4" />;
        const assigneeName = teamMembers.find(m => m.user_id === activity.metadata?.assigneeId)?.user?.full_name || 'someone';
        text = (
          <span>
            <strong>{memberName}</strong> assigned <Link to={`/firm/company/${activity.company_id}`} className="text-blue-600 hover:underline">{companyName}</Link> to <strong>{assigneeName}</strong>
          </span>
        );
        break;
      case 'expressed_interest':
        icon = <TrendingUp className="h-4 w-4" />;
        text = (
          <span>
            <strong>{memberName}</strong> expressed interest in <Link to={`/firm/company/${activity.company_id}`} className="text-blue-600 hover:underline">{companyName}</Link>
          </span>
        );
        break;
      default:
        icon = <FileText className="h-4 w-4" />;
        text = <span><strong>{memberName}</strong> performed an action on {companyName}</span>;
    }

    return (
      <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div className="flex-1">
          <p className="text-sm">{text}</p>
          <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading firm dashboard...</p>
        </div>
      </div>
    );
  }

  if (!firm) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {firm.logo_url && (
              <img src={firm.logo_url} alt={firm.name} className="h-16 w-16 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{firm.name}</h1>
              {firm.website && (
                <a
                  href={firm.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                >
                  {firm.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.companiesTracking}</p>
                <p className="text-sm text-gray-600">Companies Tracking</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.teamMembers}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-600 fill-current" />
              <div>
                <p className="text-2xl font-bold">{stats.interestsExpressed}</p>
                <p className="text-sm text-gray-600">Interests Expressed</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="activity">Team Activity</TabsTrigger>
          {isAdmin && <TabsTrigger value="profile">Firm Profile</TabsTrigger>}
          {isAdmin && <TabsTrigger value="team">Team Management</TabsTrigger>}
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Deal Pipeline</h2>

            {/* Quick Filters */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {/* Tags Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <Select
                  value={selectedTags.length > 0 ? selectedTags[0] : 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedTags([]);
                    } else {
                      setSelectedTags([value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {Object.entries(FIRM_TAGS).map(([key, tag]) => (
                      <SelectItem key={key} value={key}>
                        {tag.emoji} {tag.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Assigned To</label>
                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Team</SelectItem>
                    <SelectItem value="me">Assigned to me</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stage Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Stage</label>
                <Select
                  value={selectedStages.length > 0 ? selectedStages[0] : 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedStages([]);
                    } else {
                      setSelectedStages([value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {Object.entries(STAGE_DISPLAY_NAMES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pipeline Table */}
            {pipelineCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your pipeline is empty</h3>
                <p className="text-gray-600 mb-4">Follow companies to start tracking deals</p>
                <Button onClick={() => setLocation('/companies')}>Discover Companies</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Company</th>
                      <th className="text-left py-3 px-4 font-semibold">Stage</th>
                      <th className="text-left py-3 px-4 font-semibold">Sectors</th>
                      <th className="text-left py-3 px-4 font-semibold">Internal Tags</th>
                      <th className="text-left py-3 px-4 font-semibold">Assigned To</th>
                      <th className="text-left py-3 px-4 font-semibold">Following Since</th>
                      <th className="text-left py-3 px-4 font-semibold">Last Activity</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineCompanies.slice((pipelinePage - 1) * itemsPerPage, pipelinePage * itemsPerPage).map((pc) => (
                      <tr key={pc.company.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            to={`/firm/company/${pc.company.id}`}
                            className="flex items-center gap-3 hover:text-blue-600"
                          >
                            {pc.company.logo_url && (
                              <img
                                src={pc.company.logo_url}
                                alt={pc.company.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{pc.company.name}</span>
                              {(pc as any).has_firm_interest && (
                                <span title="Your firm expressed interest">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                </span>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {STAGE_DISPLAY_NAMES[pc.company.stage] || pc.company.stage}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {pc.company.sector?.slice(0, 2).map((sector) => (
                              <Badge key={sector} variant="secondary" className="text-xs">
                                {sector}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {pc.latest_tags.map((tag) => {
                              const tagInfo = FIRM_TAGS[tag as keyof typeof FIRM_TAGS];
                              return tagInfo ? (
                                <Badge key={tag} className={`text-xs bg-${tagInfo.color}-100 text-${tagInfo.color}-800`}>
                                  {tagInfo.emoji} {tagInfo.label}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {pc.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={pc.assigned_to.avatar_url || ''} />
                                <AvatarFallback>
                                  {pc.assigned_to.full_name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{pc.assigned_to.full_name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {formatDistanceToNow(new Date(pc.followed_since), { addSuffix: true })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {pc.last_activity ? (
                            <span className="text-sm text-gray-600">
                              {formatDistanceToNow(new Date(pc.last_activity), { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setLocation(`/firm/company/${pc.company.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => removeCompanyFromPipeline(pc.company.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {pipelineCompanies.length > itemsPerPage && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pipelinePage === 1}
                      onClick={() => setPipelinePage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {pipelinePage} of {Math.ceil(pipelineCompanies.length / itemsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pipelinePage >= Math.ceil(pipelineCompanies.length / itemsPerPage)}
                      onClick={() => setPipelinePage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Team Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Team Activity</h2>
              
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All activity</SelectItem>
                  <SelectItem value="me">My activity</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => renderActivityItem(activity))}
              </div>
            )}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Firm Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firmName">Firm Name *</Label>
                  <Input
                    id="firmName"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="Enter firm name"
                  />
                </div>
                <div>
                  <Label htmlFor="firmWebsite">Website</Label>
                  <Input
                    id="firmWebsite"
                    type="url"
                    value={firmWebsite}
                    onChange={(e) => setFirmWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label>Logo</Label>
                  <FileUpload
                    onUploadComplete={(url) => setFirmLogo(url)}
                    bucket="firm-logos"
                    accept="image/*"
                  />
                  {firmLogo && (
                    <div className="mt-2">
                      <img src={firmLogo} alt="Firm logo" className="h-20 w-20 rounded-lg object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Investment Thesis</h2>
              <div className="space-y-4">
                <div>
                  <Label>Stages</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {STAGES.map((stage) => (
                      <label key={stage} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={investmentThesis.stages.includes(stage)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInvestmentThesis({
                                ...investmentThesis,
                                stages: [...investmentThesis.stages, stage],
                              });
                            } else {
                              setInvestmentThesis({
                                ...investmentThesis,
                                stages: investmentThesis.stages.filter((s) => s !== stage),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{stage}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Sectors</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SECTORS.slice(0, 15).map((sector) => (
                      <label key={sector} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={investmentThesis.sectors.includes(sector)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInvestmentThesis({
                                ...investmentThesis,
                                sectors: [...investmentThesis.sectors, sector],
                              });
                            } else {
                              setInvestmentThesis({
                                ...investmentThesis,
                                sectors: investmentThesis.sectors.filter((s) => s !== sector),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{sector}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="geography">Geography</Label>
                  <Input
                    id="geography"
                    value={investmentThesis.geography}
                    onChange={(e) => setInvestmentThesis({ ...investmentThesis, geography: e.target.value })}
                    placeholder="e.g., North America, Global"
                  />
                </div>
                <div>
                  <Label htmlFor="checkSize">Check Size</Label>
                  <Input
                    id="checkSize"
                    value={investmentThesis.check_size}
                    onChange={(e) => setInvestmentThesis({ ...investmentThesis, check_size: e.target.value })}
                    placeholder="e.g., $500K - $2M"
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-between items-center">
              <Button onClick={saveFirmProfile} size="lg">
                Save Changes
              </Button>
              <Button variant="destructive" onClick={() => setDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Firm
              </Button>
            </div>
          </TabsContent>
        )}

        {/* Team Management Tab */}
        {isAdmin && (
          <TabsContent value="team" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Current Team Members</h2>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user?.avatar_url || ''} />
                        <AvatarFallback>{member.user?.full_name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user?.full_name}</p>
                        {editingMemberId === member.id ? (
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Title"
                            className="w-48 h-7 text-sm"
                            onBlur={() => updateMemberTitle(member.id)}
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{member.title || 'No title'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      {member.user_id !== user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setEditTitle(member.title || '');
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Select
                            value={member.role || 'member'}
                            onValueChange={(value) => changeRole(member.id, value as 'admin' | 'member')}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRemoveMemberId(member.id)}
                          >
                            <UserMinus className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Invite Team Member</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="inviteEmail">Email *</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="team@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="inviteTitle">Title</Label>
                  <Input
                    id="inviteTitle"
                    value={inviteTitle}
                    onChange={(e) => setInviteTitle(e.target.value)}
                    placeholder="e.g., Senior Associate"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'admin' | 'member')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={inviteTeamMember} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Firm Confirmation Dialog */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Firm</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your firm? This will permanently delete all firm data including team members, notes, and pipeline companies. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFirm} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!removeMemberId} onOpenChange={(open) => !open && setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? They will lose access to the firm dashboard and all internal data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeMember(removeMemberId!)}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  );
}
