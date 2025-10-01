import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Navigation } from '@/components/navigation';
import { MultiSelect } from '@/components/multi-select-component';
import { FileUpload } from '@/components/file-upload';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STAGES, SECTORS, STAGE_DISPLAY_NAMES, InvestmentThesis } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';

interface TeamInvite {
  id: string;
  email: string;
  role: 'admin' | 'member';
  title: string;
}

interface FormData {
  firmName: string;
  website: string;
  yourTitle: string;
  stages: string[];
  sectors: string[];
  geography: string;
  checkSize: string;
  logoUrl: string;
  teamInvites: TeamInvite[];
}

export default function FirmOnboardingPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    firmName: '',
    website: '',
    yourTitle: '',
    stages: [],
    sectors: [],
    geography: '',
    checkSize: '',
    logoUrl: '',
    teamInvites: [],
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

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.firmName.trim()) {
        newErrors.firmName = 'Firm name is required';
      }
      if (!formData.website.trim()) {
        newErrors.website = 'Website is required';
      } else if (!isValidUrl(formData.website)) {
        newErrors.website = 'Please enter a valid URL';
      }
      if (!formData.yourTitle.trim()) {
        newErrors.yourTitle = 'Your title is required';
      }
    }

    if (currentStep === 2) {
      if (formData.stages.length === 0) {
        newErrors.stages = 'Select at least one investment stage';
      }
      if (formData.sectors.length === 0) {
        newErrors.sectors = 'Select at least one sector';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const addTeamInvite = () => {
    setFormData({
      ...formData,
      teamInvites: [
        ...formData.teamInvites,
        {
          id: Date.now().toString(),
          email: '',
          role: 'member',
          title: '',
        },
      ],
    });
  };

  const removeTeamInvite = (id: string) => {
    setFormData({
      ...formData,
      teamInvites: formData.teamInvites.filter((invite) => invite.id !== id),
    });
  };

  const updateTeamInvite = (id: string, field: keyof TeamInvite, value: string) => {
    setFormData({
      ...formData,
      teamInvites: formData.teamInvites.map((invite) =>
        invite.id === id ? { ...invite, [field]: value } : invite
      ),
    });
  };

  const handleSubmit = async () => {
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

      // Create VC firm
      const { data: firm, error: firmError } = await supabase
        .from('vc_firms')
        .insert({
          name: formData.firmName,
          website: formData.website,
          logo_url: formData.logoUrl || null,
          investment_thesis: investmentThesis,
          created_by: user.id,
        })
        .select()
        .single();

      if (firmError) throw firmError;

      // Create firm_members record for current user (admin)
      const { error: memberError } = await supabase
        .from('firm_members')
        .insert({
          firm_id: firm.id,
          user_id: user.id,
          role: 'admin',
          title: formData.yourTitle,
        });

      if (memberError) throw memberError;

      // TODO: Send team invites via email (would need backend implementation)
      // For now, we'll just log them
      if (formData.teamInvites.length > 0) {
        console.log('Team invites to send:', formData.teamInvites);
        // In a real implementation, you would call a backend function to send invite emails
      }

      toast({
        title: 'Success!',
        description: 'Your firm profile has been created',
      });

      setLocation('/feed');
    } catch (error) {
      console.error('Error creating firm:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create firm profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="flex items-center justify-center p-4 pt-20">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="mb-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-slate-600 mt-2">Step {step} of 3</p>
            </div>
            <CardTitle className="text-3xl">
              {step === 1 && 'Firm Basics'}
              {step === 2 && 'Investment Focus'}
              {step === 3 && 'Logo & Team'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us about your VC firm'}
              {step === 2 && 'What are your investment preferences?'}
              {step === 3 && 'Add your logo and invite team members'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firmName">
                    Firm Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firmName"
                    value={formData.firmName}
                    onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                    placeholder="Acme Ventures"
                  />
                  {errors.firmName && (
                    <p className="text-sm text-red-500">{errors.firmName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">
                    Website <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                  {errors.website && (
                    <p className="text-sm text-red-500">{errors.website}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yourTitle">
                    Your Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="yourTitle"
                    value={formData.yourTitle}
                    onChange={(e) => setFormData({ ...formData, yourTitle: e.target.value })}
                    placeholder="e.g., Managing Partner"
                  />
                  {errors.yourTitle && (
                    <p className="text-sm text-red-500">{errors.yourTitle}</p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
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
                    placeholder="e.g., $1M-$5M"
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-4">
                  <Label>Firm Logo (Optional)</Label>
                  <FileUpload
                    bucket="firm-logos"
                    onUploadComplete={(url) => setFormData({ ...formData, logoUrl: url })}
                    currentUrl={formData.logoUrl}
                    label="Choose Logo"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Invite Team Members (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTeamInvite}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Member
                    </Button>
                  </div>

                  {formData.teamInvites.map((invite) => (
                    <Card key={invite.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`email-${invite.id}`}>Email</Label>
                            <Input
                              id={`email-${invite.id}`}
                              type="email"
                              value={invite.email}
                              onChange={(e) =>
                                updateTeamInvite(invite.id, 'email', e.target.value)
                              }
                              placeholder="colleague@example.com"
                            />
                          </div>
                          <div className="w-32 space-y-2">
                            <Label htmlFor={`role-${invite.id}`}>Role</Label>
                            <Select
                              value={invite.role}
                              onValueChange={(value) =>
                                updateTeamInvite(invite.id, 'role', value)
                              }
                            >
                              <SelectTrigger id={`role-${invite.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTeamInvite(invite.id)}
                            className="mt-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`title-${invite.id}`}>Title</Label>
                          <Input
                            id={`title-${invite.id}`}
                            value={invite.title}
                            onChange={(e) =>
                              updateTeamInvite(invite.id, 'title', e.target.value)
                            }
                            placeholder="e.g., Partner, Associate"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  {formData.teamInvites.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No team members added. You can add them later.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="ml-auto">
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Complete'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
