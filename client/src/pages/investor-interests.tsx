import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { CompanyInterest, User, CompanyWithFounders } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navigation } from '@/components/navigation';
import { EmptyState } from '@/components/empty-state';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import { 
  Building2, 
  Loader2, 
  Star,
  Trash2,
  FileText,
  Calendar,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface InterestWithCompany extends CompanyInterest {
  company: CompanyWithFounders;
  latest_post?: {
    content: string;
    created_at: string;
  };
}

export default function InvestorInterestsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [interests, setInterests] = useState<InterestWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<InterestWithCompany | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        if (!user) return;

        // Fetch interests with company data
        const { data: interestsData, error: interestsError } = await supabase
          .from('company_interests')
          .select(`
            *,
            company:companies(
              *,
              founders:company_founders(
                id,
                user_id,
                title,
                is_primary,
                user:users(*)
              )
            )
          `)
          .eq('investor_id', user.id)
          .order('created_at', { ascending: false });

        if (interestsError) throw interestsError;

        // For each interest, get the latest post from the company
        const enrichedInterests = await Promise.all(
          (interestsData || []).map(async (interest: any) => {
            const { data: latestPost } = await supabase
              .from('posts')
              .select('content, created_at')
              .eq('company_id', interest.company_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...interest,
              latest_post: latestPost,
            };
          })
        );

        setInterests(enrichedInterests as InterestWithCompany[]);
      } catch (error) {
        console.error('Error loading interests:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleWithdrawClick = (interest: InterestWithCompany) => {
    setSelectedInterest(interest);
    setShowWithdrawDialog(true);
  };

  const handleWithdraw = async () => {
    if (!selectedInterest) return;

    setWithdrawingId(selectedInterest.id);

    try {
      const { error } = await supabase
        .from('company_interests')
        .delete()
        .eq('id', selectedInterest.id);

      if (error) throw error;

      setInterests(interests.filter(i => i.id !== selectedInterest.id));

      toast({
        title: "Interest Withdrawn",
        description: `You've withdrawn interest from ${selectedInterest.company.name}`,
      });
    } catch (error) {
      console.error('Error withdrawing interest:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw interest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWithdrawingId(null);
      setShowWithdrawDialog(false);
      setSelectedInterest(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">My Interests</h1>
            <p className="text-muted-foreground">
              Companies you've expressed interest in
            </p>
          </div>

          {/* Interests List */}
          {interests.length > 0 ? (
            <div className="space-y-4">
              {interests.map((interest) => (
                <Card key={interest.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Company Logo */}
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={interest.company.logo_url || undefined} />
                        <AvatarFallback>
                          <Building2 className="h-10 w-10" />
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Link to={`/company/${interest.company.id}`}>
                              <h3 className="font-semibold text-xl hover:underline mb-1">
                                {interest.company.name}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground mb-2">
                              {interest.company.one_line_pitch || 'No pitch available'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {interest.company.stage && (
                                <StageBadge stage={interest.company.stage} />
                              )}
                              {interest.company.sector?.slice(0, 2).map((sector) => (
                                <SectorBadge key={sector} sector={sector} />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Your Message */}
                        {interest.message && (
                          <div className="mb-3 p-3 bg-muted rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Your message:
                            </p>
                            <p className="text-sm">{interest.message}</p>
                          </div>
                        )}

                        {/* Latest Update */}
                        {interest.latest_post && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <p className="text-xs font-medium text-blue-600">
                                Latest Update
                              </p>
                            </div>
                            <p className="text-sm line-clamp-2">
                              {interest.latest_post.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(interest.latest_post.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        )}

                        {/* Metadata and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Expressed interest {formatDistanceToNow(new Date(interest.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/company/${interest.company.id}`}>
                              <Button variant="outline" size="sm">
                                View Company
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWithdrawClick(interest)}
                              disabled={withdrawingId === interest.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {withdrawingId === interest.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Withdraw
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Star}
                  title="No interests expressed yet"
                  description="Start exploring companies and express your interest to stay updated."
                  action={{
                    label: "Browse Companies",
                    onClick: () => window.location.href = '/companies',
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Interest?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw your interest in{' '}
              <strong>{selectedInterest?.company.name}</strong>?
              <br />
              <br />
              Note: Founders will still see that you previously expressed interest.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Withdraw Interest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

