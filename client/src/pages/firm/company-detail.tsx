import { Navigation } from '@/components/navigation';
import { useEffect, useState } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  type CompanyWithFounders,
  type FirmNoteWithAuthor,
  type FirmMemberWithUser,
  type VCFirm,
  type PostWithEngagement,
  FIRM_TAGS,
  STAGE_DISPLAY_NAMES,
} from '@/lib/types';
import { logAddedNote, logUpdatedNote, logTaggedCompany, logAssignedDeal } from '@/lib/firm-activity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
  ExternalLink,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  X,
  Plus,
  ArrowLeft,
  Star,
  Heart,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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
import { PostCard } from '@/components/post-card';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import {
  FileText,
} from 'lucide-react';

export default function FirmCompanyDetailPage() {
  const [, params] = useRoute('/firm/company/:id');
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [firm, setFirm] = useState<VCFirm | null>(null);
  const [company, setCompany] = useState<CompanyWithFounders | null>(null);
  const [notes, setNotes] = useState<FirmNoteWithAuthor[]>([]);
  const [teamMembers, setTeamMembers] = useState<FirmMemberWithUser[]>([]);
  const [posts, setPosts] = useState<PostWithEngagement[]>([]);
  
  // New note form
  const [noteContent, setNoteContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  
  // Edit mode
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    followerCount: 0,
    interestCount: 0,
    firmFollowers: [] as any[],
    firmExpressedInterest: false,
    firmInterestData: null as any,
  });

  // Current tags on company (from latest notes)
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);

  useEffect(() => {
    checkFirmMembershipAndLoadData();
  }, [id]);

  async function checkFirmMembershipAndLoadData() {
    if (!id) return;

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

    // Check if firm follows or has expressed interest in this company
    const { data: follow } = await supabase
      .from('company_follows')
      .select()
      .eq('firm_id', membership.vc_firms.id)
      .eq('company_id', id)
      .maybeSingle();

    const { data: interest } = await supabase
      .from('company_interests')
      .select()
      .eq('firm_id', membership.vc_firms.id)
      .eq('company_id', id)
      .maybeSingle();

    if (!follow && !interest) {
      toast({
        title: 'Access Denied',
        description: 'Your firm must follow this company to view internal details.',
        variant: 'destructive',
      });
      setLocation('/firm/dashboard');
      return;
    }

    // Load company data
    if (id) {
      await loadCompanyData(id);
      await loadFirmNotes(membership.vc_firms.id, id);
      await loadCompanyStats(id);
      await loadCompanyPosts(id);
    }

    setLoading(false);
  }

  async function loadCompanyData(companyId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select(
        `
        *,
        founders:company_founders(*, user:users(*))
      `
      )
      .eq('id', companyId)
      .single();

    if (error || !data) {
      toast({
        title: 'Error',
      description: 'Company not found.',
      variant: 'destructive',
    });
    setLocation('/firm/dashboard');
    return;
  }

  setCompany({
    ...data,
    founders: data.founders || [],
    stage: data.stage || 'pre-seed',
  } as CompanyWithFounders);
  }

  async function loadFirmNotes(firmId: string, companyId: string) {
    const { data } = await supabase
      .from('firm_notes')
      .select('*, author:users!firm_notes_author_id_fkey(*)')
      .eq('firm_id', firmId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false});

    if (data) {
      const notesWithAuthor: FirmNoteWithAuthor[] = data.map((note: any) => ({
        ...note,
        author: note.author,
      }));
      setNotes(notesWithAuthor);

      // Extract current tags
      const tagSet = new Set<string>();
      for (const note of notesWithAuthor) {
        if (note.tags && note.tags.length > 0) {
          note.tags.forEach((tag) => tagSet.add(tag));
        }
      }
      setCurrentTags(Array.from(tagSet));
    }

    // Load assignment separately from company_assignments table
    const { data: assignmentData } = await supabase
      .from('company_assignments')
      .select('*, assignee:users!company_assignments_assigned_to_fkey(*)')
      .eq('firm_id', firmId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (assignmentData && assignmentData.assigned_to) {
      setCurrentAssignment(assignmentData.assignee);
    } else {
      setCurrentAssignment(null);
    }
  }

  async function loadCompanyStats(companyId: string | undefined) {
    if (!companyId) return;
    
    // Count followers
    const { count: followerCount } = await supabase
      .from('company_follows')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // Count interests
    const { count: interestCount } = await supabase
      .from('company_interests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // Get firm followers
    const firmId = firm?.id;
    const { data: firmFollows } = firmId ? await supabase
      .from('company_follows')
      .select('*, follower:users(*)')
      .eq('company_id', companyId)
      .eq('firm_id', firmId) : { data: null };

    // Check if firm has expressed interest
    const { data: firmInterest } = firmId ? await supabase
      .from('company_interests')
      .select('*, investor:users(*)')
      .eq('company_id', companyId)
      .eq('firm_id', firmId)
      .single() : { data: null };

    setStats({
      followerCount: followerCount || 0,
      interestCount: interestCount || 0,
      firmFollowers: firmFollows || [],
      firmExpressedInterest: !!firmInterest,
      firmInterestData: firmInterest,
    });
  }

  async function loadCompanyPosts(companyId: string | undefined) {
    if (!companyId) return;
    
    const { data } = await supabase
      .from('posts')
      .select(
        `
        *,
        author:users!posts_author_id_fkey(*),
        company:companies(*)
      `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (data && user) {
      // Get engagement data
      const postIds = data.map((p) => p.id);

      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      const { data: comments } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds);

      const postsWithEngagement: PostWithEngagement[] = data.map((post: any) => {
        const postLikes = likes?.filter((l: any) => l.post_id === post.id) || [];
        const postComments = comments?.filter((c: any) => c.post_id === post.id) || [];
        const userHasLiked = postLikes.some((l: any) => l.user_id === user.id);

        return {
          ...post,
          author: post.author,
          company: post.company,
          like_count: postLikes.length,
          comment_count: postComments.length,
          user_has_liked: userHasLiked,
        };
      });

      setPosts(postsWithEngagement);
    }
  }

  async function addNote() {
    if (!noteContent.trim() || !firm || !company) return;

    if (noteContent.length > 1000) {
      toast({
        title: 'Error',
        description: 'Note must be 1000 characters or less.',
        variant: 'destructive',
      });
      return;
    }

    const { data, error } = await supabase
      .from('firm_notes')
      .insert({
        firm_id: firm.id,
        company_id: company.id,
        author_id: user.id,
        content: noteContent,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add note.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Note added.',
    });

    // Log activity
    await logAddedNote(firm.id, user.id, company.id, data.id, [], null);

    // Reset form
    setNoteContent('');

    // Reload notes
    await loadFirmNotes(firm.id, company.id);
  }

  async function updateNote(noteId: string) {
    if (!editContent.trim() || !firm || !company) return;

    if (editContent.length > 1000) {
      toast({
        title: 'Error',
        description: 'Note must be 1000 characters or less.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('firm_notes')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', noteId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update note.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Note updated.',
    });

    await logUpdatedNote(firm.id, user.id, company.id, noteId);

    setEditingNoteId(null);
    setEditContent('');

    await loadFirmNotes(firm.id, company.id);
  }

  async function deleteNote(noteId: string) {
    if (!firm || !company) return;

    const { error } = await supabase.from('firm_notes').delete().eq('id', noteId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete note.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Note deleted.',
    });

    setDeleteNoteId(null);
    await loadFirmNotes(firm.id, company.id);
  }

  async function addTag(tag: string) {
    if (!firm || !company) return;

    // Create a note with just the tag
    const { data, error } = await supabase
      .from('firm_notes')
      .insert({
        firm_id: firm.id,
        company_id: company.id,
        author_id: user.id,
        content: `Tagged as ${FIRM_TAGS[tag as keyof typeof FIRM_TAGS].label}`,
        tags: [tag],
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add tag.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `Tagged as ${FIRM_TAGS[tag as keyof typeof FIRM_TAGS].label}`,
    });

    await logTaggedCompany(firm.id, user.id, company.id, [tag]);
    await loadFirmNotes(firm.id, company.id);
  }

  async function removeTag(tag: string) {
    if (!firm || !company) return;

    // Create a note indicating tag removal
    await supabase.from('firm_notes').insert({
      firm_id: firm.id,
      company_id: company.id,
      author_id: user.id,
      content: `Removed tag: ${FIRM_TAGS[tag as keyof typeof FIRM_TAGS].label}`,
      tags: [],
    });

    toast({
      title: 'Success',
      description: 'Tag removed.',
    });

    await loadFirmNotes(firm.id, company.id);
  }

  async function changeAssignment(newAssigneeId: string) {
    if (!firm || !company || !user) return;

    const assigneeName = newAssigneeId === "unassigned" ? "Unassigned" : teamMembers.find((m) => m.user_id === newAssigneeId)?.user?.full_name || 'someone';

    // UPSERT into company_assignments table
    const { error } = await supabase
      .from('company_assignments')
      .upsert({
        firm_id: firm.id,
        company_id: company.id,
        assigned_to: newAssigneeId === "unassigned" ? null : newAssigneeId,
        assigned_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'firm_id,company_id'
      });

    if (error) {
      console.error('Assignment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment.',
        variant: 'destructive',
      });
      return;
    }

    // Also create a note for historical tracking
    await supabase.from('firm_notes').insert({
      firm_id: firm.id,
      company_id: company.id,
      author_id: user.id,
      content: newAssigneeId === "unassigned" ? "Unassigned company" : `Assigned to ${assigneeName}`,
    });

    toast({
      title: 'Success',
      description: newAssigneeId === "unassigned" ? 'Company unassigned' : `Assigned to ${assigneeName}`,
    });

    if (newAssigneeId && newAssigneeId !== "unassigned") {
      await logAssignedDeal(firm.id, user.id, company.id, newAssigneeId);
    }

    await loadFirmNotes(firm.id, company.id);
  }

  function handleMentionInsert(memberName: string) {
    setNoteContent((prev) => {
      const lastAtIndex = prev.lastIndexOf('@');
      if (lastAtIndex === -1) return prev;
      return prev.substring(0, lastAtIndex) + `@${memberName} `;
    });
    setShowMentionDropdown(false);
    setMentionSearch('');
  }

  function handleNoteContentChange(value: string) {
    setNoteContent(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  }

  const filteredMembers = teamMembers.filter((m) =>
    m.user?.full_name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (!company || !firm) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back button */}
      <Button variant="ghost" onClick={() => setLocation('/firm/dashboard')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Company Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {company.logo_url && (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
              <p className="text-gray-600 mb-3">{company.one_line_pitch}</p>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <StageBadge stage={company.stage} />
                {company.sector?.map((sector) => (
                  <SectorBadge key={sector} sector={sector} />
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                {company.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {company.location}
                  </div>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    Visit website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-green-100 text-green-800">Following as firm</Badge>
            {currentTags.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end">
                {currentTags.map((tag) => {
                  const tagInfo = FIRM_TAGS[tag as keyof typeof FIRM_TAGS];
                  return tagInfo ? (
                    <Badge key={tag} className={`text-xs`}>
                      {tagInfo.emoji} {tagInfo.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            <Link to={`/company/${company.id}`} className="text-sm text-blue-600 hover:underline">
              View Public Page →
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Internal Notes */}
        <div className="col-span-2 space-y-6">
          {/* Add Note Form */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add Internal Note</h3>

            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Add internal note... (Type @ to mention team members)"
                  value={noteContent}
                  onChange={(e) => handleNoteContentChange(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">{noteContent.length}/1000 characters</p>

                {showMentionDropdown && filteredMembers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-64 bg-white border rounded-lg shadow-lg">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.user_id}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => handleMentionInsert(member.user?.full_name || '')}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.user?.avatar_url || ''} />
                          <AvatarFallback>{member.user?.full_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.user?.full_name}</p>
                          <p className="text-xs text-gray-500">{member.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tag Selector */}
              <Button onClick={addNote} disabled={!noteContent.trim()}>
                Add Note
              </Button>
            </div>
          </Card>

          {/* Notes Timeline */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Internal Notes</h3>

            {notes.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No internal notes yet. Start the conversation!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={note.author?.avatar_url || ''} />
                        <AvatarFallback>{note.author?.full_name?.[0] || '?'}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">{note.author?.full_name}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                            </p>
                          </div>

                          {note.author_id === user?.id && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditContent(note.content);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => setDeleteNoteId(note.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {editingNoteId === note.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                              maxLength={1000}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateNote(note.id)}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditContent('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-700 mb-2 whitespace-pre-wrap">{note.content}</p>

                            {note.tags && note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {note.tags.map((tag) => {
                                  const tagInfo = FIRM_TAGS[tag as keyof typeof FIRM_TAGS];
                                  return tagInfo ? (
                                    <Badge key={tag} className="text-xs">
                                      {tagInfo.emoji} {tagInfo.label}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Company Summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Company Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stage:</span>
                <span className="font-medium">{STAGE_DISPLAY_NAMES[company.stage] || company.stage}</span>
              </div>
              {company.location && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{company.location}</span>
                </div>
              )}
              {company.founded_date && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Founded:</span>
                  <span className="font-medium">{format(new Date(company.founded_date), 'MMM yyyy')}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Team:</span>
                <span className="font-medium">{company.founders?.length || 0} founders</span>
              </div>
            </div>
          </Card>

          {/* Tags Management */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Tags</h3>
            
            {currentTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentTags.map((tag) => {
                  const tagInfo = FIRM_TAGS[tag as keyof typeof FIRM_TAGS];
                  return tagInfo ? (
                    <Badge key={tag} className="text-xs flex items-center gap-1">
                      {tagInfo.emoji} {tagInfo.label}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            <Select onValueChange={addTag}>
              <SelectTrigger>
                <SelectValue placeholder="+ Add Tag" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIRM_TAGS).map(([key, tag]) => (
                  <SelectItem key={key} value={key}>
                    {tag.emoji} {tag.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Assignment */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Assignment</h3>
            
            {currentAssignment ? (
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentAssignment.avatar_url || ''} />
                  <AvatarFallback>{currentAssignment.full_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{currentAssignment.full_name}</p>
                  <p className="text-xs text-gray-500">Assigned to</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-3">Unassigned</p>
            )}

            <Select onValueChange={changeAssignment}>
              <SelectTrigger>
                <SelectValue placeholder="Change assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.user?.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Quick Stats */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            
            {/* Firm Interest Status */}
            {stats.firmExpressedInterest && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-600 fill-current" />
                  <span className="font-semibold text-yellow-900">Your Firm Expressed Interest</span>
                </div>
                <p className="text-xs text-yellow-700">
                  {stats.firmInterestData?.investor?.full_name} expressed interest {formatDistanceToNow(new Date(stats.firmInterestData?.created_at), { addSuffix: true })}
                </p>
                {stats.firmInterestData?.message && (
                  <p className="text-xs text-yellow-700 mt-1 italic">
                    "{stats.firmInterestData.message}"
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Followers:</span>
                <span className="font-medium">{stats.followerCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Interests Expressed:</span>
                <span className="font-medium">{stats.interestCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Internal Notes:</span>
                <span className="font-medium">{notes.length}</span>
              </div>
            </div>

            {stats.firmFollowers.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-600 mb-2">Team members following:</p>
                <div className="flex -space-x-2">
                  {stats.firmFollowers.slice(0, 5).map((follower: any) => (
                    <Avatar key={follower.id} className="h-6 w-6 border-2 border-white">
                      <AvatarImage src={follower.follower?.avatar_url || ''} />
                      <AvatarFallback>{follower.follower?.full_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Company Posts Section */}
      {posts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Company Updates</h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Delete Note Confirmation */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteNote(deleteNoteId!)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  );
}

