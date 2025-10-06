import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/navigation';
import { Loader2, ArrowLeft, Trash2, UserPlus } from 'lucide-react';

interface FounderData {
  id: string;
  user_id: string;
  title: string | null;
  is_primary: boolean | null;
  user: User;
}

export default function ManageFoundersPage() {
  const [, params] = useRoute('/company/:id/founders/manage');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [founders, setFounders] = useState<FounderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [founderToRemove, setFounderToRemove] = useState<string | null>(null);

  // Add founder form
  const [newFounderEmail, setNewFounderEmail] = useState('');
  const [newFounderTitle, setNewFounderTitle] = useState('');

  useEffect(() => {
    async function loadFounders() {
      if (!params?.id || !currentUser) return;

      try {
        // Check if user is primary founder
        const { data: primaryCheck } = await supabase
          .from('company_founders')
          .select('is_primary')
          .eq('company_id', params.id)
          .eq('user_id', currentUser.id)
          .single();

        if (!primaryCheck || !primaryCheck.is_primary) {
          toast({
            title: 'Unauthorized',
            description: 'Only the primary founder can manage co-founders',
            variant: 'destructive',
          });
          setLocation(`/company/${params.id}`);
          return;
        }

        // Fetch all founders
        const { data: foundersData, error } = await supabase
          .from('company_founders')
          .select(`
            id,
            user_id,
            title,
            is_primary,
            user:users(*)
          `)
          .eq('company_id', params.id)
          .order('is_primary', { ascending: false });

        if (error) throw error;

        setFounders(foundersData as FounderData[]);
      } catch (error) {
        console.error('Error loading founders:', error);
        toast({
          title: 'Error',
          description: 'Failed to load founders',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadFounders();
  }, [params?.id, currentUser, setLocation, toast]);

  const handleAddFounder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.id || !newFounderEmail.trim()) return;

    setSubmitting(true);
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', newFounderEmail.trim())
        .single();

      if (userError || !userData) {
        toast({
          title: 'User not found',
          description: 'No user found with that email address',
          variant: 'destructive',
        });
        return;
      }

      // Check if user is a founder type
      if (userData.user_type !== 'founder') {
        toast({
          title: 'Invalid user type',
          description: 'User is not registered as a founder',
          variant: 'destructive',
        });
        return;
      }

      // Check if already a founder
      const { data: existingFounder } = await supabase
        .from('company_founders')
        .select('id')
        .eq('company_id', params.id)
        .eq('user_id', userData.id)
        .single();

      if (existingFounder) {
        toast({
          title: 'Already a founder',
          description: 'This user is already a founder of this company',
          variant: 'destructive',
        });
        return;
      }

      // Add founder
      const { data: newFounder, error: insertError } = await supabase
        .from('company_founders')
        .insert({
          company_id: params.id,
          user_id: userData.id,
          title: newFounderTitle.trim() || null,
          is_primary: false,
        })
        .select(`
          id,
          user_id,
          title,
          is_primary,
          user:users(*)
        `)
        .single();

      if (insertError) throw insertError;

      setFounders([...founders, newFounder as FounderData]);
      setNewFounderEmail('');
      setNewFounderTitle('');

      toast({
        title: 'Success',
        description: 'Co-founder added successfully',
      });
    } catch (error) {
      console.error('Error adding founder:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add co-founder',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFounder = async (founderId: string) => {
    try {
      const { error } = await supabase
        .from('company_founders')
        .delete()
        .eq('id', founderId);

      if (error) throw error;

      setFounders(founders.filter(f => f.id !== founderId));
      setFounderToRemove(null);

      toast({
        title: 'Success',
        description: 'Co-founder removed successfully',
      });
    } catch (error) {
      console.error('Error removing founder:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove co-founder',
        variant: 'destructive',
      });
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
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setLocation(`/company/${params?.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Company
          </Button>

          <div className="grid grid-cols-1 gap-6">
            {/* Current Founders */}
            <Card>
              <CardHeader>
                <CardTitle>Current Founders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {founders.map((founder) => (
                    <div
                      key={founder.id}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={founder.user.avatar_url || undefined} />
                        <AvatarFallback>
                          {founder.user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {founder.user.full_name || 'Unnamed User'}
                          </p>
                          {founder.is_primary && (
                            <Badge variant="default">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {founder.user.email}
                        </p>
                        {founder.title && (
                          <p className="text-sm text-muted-foreground">
                            {founder.title}
                          </p>
                        )}
                      </div>

                      {!founder.is_primary && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setFounderToRemove(founder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Add Founder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add Co-Founder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddFounder} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="founder@example.com"
                      value={newFounderEmail}
                      onChange={(e) => setNewFounderEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      User must be registered as a founder type
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      placeholder="e.g., CTO, COO"
                      value={newFounderTitle}
                      onChange={(e) => setNewFounderTitle(e.target.value)}
                    />
                  </div>

                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Co-Founder
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Done Button */}
            <div className="flex justify-end">
              <Button onClick={() => setLocation(`/company/${params?.id}`)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!founderToRemove}
        onOpenChange={(open) => !open && setFounderToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Co-Founder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this person from your company. They will no longer have access to edit company information.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => founderToRemove && handleRemoveFounder(founderToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

