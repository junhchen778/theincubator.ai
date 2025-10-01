import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { STAGES, SECTORS, STAGE_DISPLAY_NAMES } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FormData {
  companyName: string;
  oneLiner: string;
  stage: string;
  sectors: string[];
  website: string;
  location: string;
  foundedDate: string;
  description: string;
  logoUrl: string;
}

export default function CompanyOnboardingPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    oneLiner: '',
    stage: '',
    sectors: [],
    website: '',
    location: '',
    foundedDate: '',
    description: '',
    logoUrl: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!formData.oneLiner.trim()) {
        newErrors.oneLiner = 'One-line pitch is required';
      } else if (formData.oneLiner.length > 100) {
        newErrors.oneLiner = 'One-line pitch must be 100 characters or less';
      }
      if (!formData.stage) {
        newErrors.stage = 'Stage is required';
      }
      if (formData.sectors.length === 0) {
        newErrors.sectors = 'Select at least one sector';
      }
    }

    if (currentStep === 2) {
      if (formData.website && !isValidUrl(formData.website)) {
        newErrors.website = 'Please enter a valid URL';
      }
      if (formData.description.length > 500) {
        newErrors.description = 'Description must be 500 characters or less';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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

  const handleSkipLogo = async () => {
    await handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          one_line_pitch: formData.oneLiner,
          stage: formData.stage,
          sector: formData.sectors,
          website: formData.website || null,
          location: formData.location || null,
          founded_date: formData.foundedDate || null,
          description: formData.description || null,
          logo_url: formData.logoUrl || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create company_founders record
      const { error: founderError } = await supabase
        .from('company_founders')
        .insert({
          company_id: company.id,
          user_id: user.id,
          is_primary: true,
        });

      if (founderError) throw founderError;

      toast({
        title: 'Success!',
        description: 'Your company profile has been created',
      });

      setLocation('/feed');
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create company profile',
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
              {step === 1 && 'Company Basics'}
              {step === 2 && 'Company Details'}
              {step === 3 && 'Upload Logo'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us the essentials about your company'}
              {step === 2 && 'Add more details about your company'}
              {step === 3 && 'Make your profile stand out with a logo'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Acme Inc."
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500">{errors.companyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oneLiner">
                    One-line Pitch <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="oneLiner"
                    value={formData.oneLiner}
                    onChange={(e) => setFormData({ ...formData, oneLiner: e.target.value })}
                    placeholder="We're building the future of..."
                    maxLength={100}
                  />
                  <p className="text-xs text-slate-500">
                    {formData.oneLiner.length}/100 characters
                  </p>
                  {errors.oneLiner && (
                    <p className="text-sm text-red-500">{errors.oneLiner}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">
                    Stage <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => setFormData({ ...formData, stage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {STAGE_DISPLAY_NAMES[stage]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.stage && (
                    <p className="text-sm text-red-500">{errors.stage}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Sectors <span className="text-red-500">*</span>
                  </Label>
                  <MultiSelect
                    options={SECTORS}
                    value={formData.sectors}
                    onChange={(value) => setFormData({ ...formData, sectors: value })}
                    placeholder="Select sectors"
                  />
                  {errors.sectors && (
                    <p className="text-sm text-red-500">{errors.sectors}</p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foundedDate">Founded Date</Label>
                  <Input
                    id="foundedDate"
                    type="date"
                    value={formData.foundedDate}
                    onChange={(e) => setFormData({ ...formData, foundedDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us more about your company..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500">
                    {formData.description.length}/500 characters
                  </p>
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <FileUpload
                  bucket="company-logos"
                  onUploadComplete={(url) => setFormData({ ...formData, logoUrl: url })}
                  currentUrl={formData.logoUrl}
                  label="Choose Logo"
                />
                <p className="text-sm text-slate-500">
                  Upload a square logo (PNG or JPEG, max 2MB)
                </p>
              </div>
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
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={handleSkipLogo}
                  disabled={loading}
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.logoUrl}
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
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
