import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Navigation } from '@/components/navigation';
import { MultiSelect } from '@/components/multi-select-component';
import { STAGES, SECTORS, STAGE_DISPLAY_NAMES, InvestmentThesis } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FormData {
  stages: string[];
  sectors: string[];
  geography: string;
  checkSize: string;
  bio: string;
  linkedinUrl: string;
}

export default function InvestorOnboardingPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    stages: [],
    sectors: [],
    geography: '',
    checkSize: '',
    bio: '',
    linkedinUrl: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (formData.stages.length === 0) {
      newErrors.stages = 'Select at least one investment stage';
    }
    if (formData.sectors.length === 0) {
      newErrors.sectors = 'Select at least one sector';
    }
    if (formData.bio.length > 300) {
      newErrors.bio = 'Bio must be 300 characters or less';
    }
    if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Create investment thesis
      const investmentThesis: InvestmentThesis = {
        stages: formData.stages,
        sectors: formData.sectors,
        geography: formData.geography,
        check_size: formData.checkSize,
      };

      // Upsert individual_investors record (update if exists, insert if not)
      const { error: investorError } = await supabase
        .from('individual_investors')
        .upsert({
          user_id: user.id,
          investment_thesis: investmentThesis as any,
        }, {
          onConflict: 'user_id',
        });

      if (investorError) throw investorError;

      // Update users table with bio and linkedin_url
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          bio: formData.bio || null,
          linkedin_url: formData.linkedinUrl || null,
        })
        .eq('id', user.id);

      if (userUpdateError) throw userUpdateError;

      toast({
        title: 'Success!',
        description: 'Your investor profile has been created',
      });

      setLocation('/feed');
    } catch (error) {
      console.error('Error creating investor profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create investor profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="flex items-center justify-center p-4 pt-20">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Set up your investor profile</CardTitle>
            <CardDescription>
              Tell us about your investment interests and preferences
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>
                Investment Stages <span className="text-red-500">*</span>
              </Label>
              <MultiSelect
                options={STAGES}
                value={formData.stages}
                onChange={(value) => setFormData({ ...formData, stages: value })}
                placeholder="Select stages you invest in"
                displayNames={STAGE_DISPLAY_NAMES}
              />
              {errors.stages && (
                <p className="text-sm text-red-500">{errors.stages}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Sectors of Interest <span className="text-red-500">*</span>
              </Label>
              <MultiSelect
                options={SECTORS}
                value={formData.sectors}
                onChange={(value) => setFormData({ ...formData, sectors: value })}
                placeholder="Select sectors of interest"
              />
              {errors.sectors && (
                <p className="text-sm text-red-500">{errors.sectors}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="geography">Geography</Label>
              <Input
                id="geography"
                value={formData.geography}
                onChange={(e) => setFormData({ ...formData, geography: e.target.value })}
                placeholder="e.g., US only, Global, Europe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkSize">Check Size</Label>
              <Input
                id="checkSize"
                value={formData.checkSize}
                onChange={(e) => setFormData({ ...formData, checkSize: e.target.value })}
                placeholder="e.g., $25K-$100K"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={300}
              />
              <p className="text-xs text-slate-500">
                {formData.bio.length}/300 characters
              </p>
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
              {errors.linkedinUrl && (
                <p className="text-sm text-red-500">{errors.linkedinUrl}</p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating profile...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
