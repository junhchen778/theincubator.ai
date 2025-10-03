import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FileUpload } from '@/components/file-upload';
import { MultiSelect } from '@/components/multi-select-component';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, clearUserCache } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExternalLink } from 'lucide-react';
import { STAGES, SECTORS, STAGE_DISPLAY_NAMES, type InvestmentThesis } from '@/lib/types';

interface ProfileFormData {
  fullName: string;
  bio: string;
  linkedinUrl: string;
  avatarUrl: string;
  title?: string;
  investmentThesis?: {
    stages: string[];
    sectors: string[];
    geography: string;
    checkSize: string;
  };
}

export default function ProfileEditPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userType, setUserType] = useState<string>('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [firmId, setFirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    bio: '',
    linkedinUrl: '',
    avatarUrl: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const loadCurrentProfile = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      
      if (!user) {
        setLocation('/auth/sign-in');
        return;
      }

      setCurrentUserId(user.id);
      setUserType(user.user_type);

      // Set basic profile data
      const profileData: ProfileFormData = {
        fullName: user.full_name || '',
        bio: user.bio || '',
        linkedinUrl: user.linkedin_url || '',
        avatarUrl: user.avatar_url || '',
      };

      // Load additional data based on user type
      if (user.user_type === 'founder') {
        const { data: founderData } = await supabase
          .from('company_founders')
          .select('company_id, title')
          .eq('user_id', user.id)
          .single();

        if (founderData) {
          setCompanyId(founderData.company_id);
          profileData.title = founderData.title || undefined;
        }
      } else if (user.user_type === 'individual_investor') {
        const { data: investorData } = await supabase
          .from('individual_investors')
          .select('investment_thesis')
          .eq('user_id', user.id)
          .single();

        if (investorData?.investment_thesis) {
          const thesis = investorData.investment_thesis as InvestmentThesis;
          profileData.investmentThesis = {
            stages: thesis.stages || [],
            sectors: thesis.sectors || [],
            geography: thesis.geography || '',
            checkSize: thesis.check_size || '',
          };
        }
      } else if (user.user_type === 'firm_member') {
        const { data: memberData } = await supabase
          .from('firm_members')
          .select('firm_id, title')
          .eq('user_id', user.id)
          .single();

        if (memberData) {
          setFirmId(memberData.firm_id);
          profileData.title = memberData.title || undefined;

          // Load firm investment thesis
          const { data: firmData } = await supabase
            .from('vc_firms')
            .select('investment_thesis')
            .eq('id', memberData.firm_id)
            .single();

          if (firmData?.investment_thesis) {
            const thesis = firmData.investment_thesis as InvestmentThesis;
            profileData.investmentThesis = {
              stages: thesis.stages || [],
              sectors: thesis.sectors || [],
              geography: thesis.geography || '',
              checkSize: thesis.check_size || '',
            };
          }
        }
      }

      setFormData(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (formData.bio.length > 300) {
      newErrors.bio = 'Bio must be 300 characters or less';
    }
    if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName || null,
          bio: formData.bio || null,
          linkedin_url: formData.linkedinUrl || null,
          avatar_url: formData.avatarUrl || null,
        })
        .eq('id', currentUserId);

      if (userError) throw userError;

      // Update type-specific tables
      if (userType === 'individual_investor' && formData.investmentThesis) {
        const investmentThesis: InvestmentThesis = {
          stages: formData.investmentThesis.stages,
          sectors: formData.investmentThesis.sectors,
          geography: formData.investmentThesis.geography,
          check_size: formData.investmentThesis.checkSize,
        };

        const { error: investorError } = await supabase
          .from('individual_investors')
          .update({
            investment_thesis: investmentThesis,
          })
          .eq('user_id', currentUserId);

        if (investorError) throw investorError;
      }

      if (userType === 'firm_member' && firmId && formData.title) {
        const { error: memberError } = await supabase
          .from('firm_members')
          .update({
            title: formData.title,
          })
          .eq('user_id', currentUserId)
          .eq('firm_id', firmId);

        if (memberError) throw memberError;
      }

      // Clear user cache to force fresh data on next load
      clearUserCache();

      toast({
        title: 'Success!',
        description: 'Your profile has been updated',
      });

      setLocation(`/profile/${currentUserId}`);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocation(`/profile/${currentUserId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-20 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <FileUpload
                bucket="avatars"
                onUploadComplete={(url) => setFormData({ ...formData, avatarUrl: url })}
                currentUrl={formData.avatarUrl}
                label="Change Picture"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Your name"
              />
            </div>

            {/* Bio */}
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

            {/* LinkedIn URL */}
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

            {/* Title for firm members */}
            {userType === 'firm_member' && (
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Managing Partner"
                />
              </div>
            )}

            {/* Investment Thesis for investors and firm members */}
            {(userType === 'individual_investor' || userType === 'firm_member') && formData.investmentThesis && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Investment Thesis
                    {userType === 'firm_member' && (
                      <p className="text-sm font-normal text-slate-600 mt-1">
                        Note: Investment thesis is managed at the firm level
                      </p>
                    )}
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label>Investment Stages</Label>
                  <MultiSelect
                    options={STAGES}
                    value={formData.investmentThesis.stages}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        investmentThesis: { ...formData.investmentThesis!, stages: value },
                      })
                    }
                    placeholder="Select stages"
                    displayNames={STAGE_DISPLAY_NAMES}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sectors of Interest</Label>
                  <MultiSelect
                    options={SECTORS}
                    value={formData.investmentThesis.sectors}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        investmentThesis: { ...formData.investmentThesis!, sectors: value },
                      })
                    }
                    placeholder="Select sectors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="geography">Geography</Label>
                  <Input
                    id="geography"
                    value={formData.investmentThesis.geography}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        investmentThesis: { ...formData.investmentThesis!, geography: e.target.value },
                      })
                    }
                    placeholder="e.g., US only, Global, Europe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkSize">Check Size</Label>
                  <Input
                    id="checkSize"
                    value={formData.investmentThesis.checkSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        investmentThesis: { ...formData.investmentThesis!, checkSize: e.target.value },
                      })
                    }
                    placeholder="e.g., $25K-$100K"
                  />
                </div>
              </>
            )}

            {/* Link to edit company for founders */}
            {userType === 'founder' && companyId && (
              <div className="border-t pt-6">
                <p className="text-sm text-slate-600 mb-2">
                  To edit company details, visit the company settings page.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/company/${companyId}/edit`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Edit Company
                  </a>
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

