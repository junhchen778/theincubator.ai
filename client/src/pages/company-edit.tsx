import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { Company, User, STAGES, SECTORS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/navigation';
import { FileUpload } from '@/components/file-upload';
import { MultiSelect } from '@/components/multi-select-component';
import { Loader2, ArrowLeft } from 'lucide-react';
import { STAGE_DISPLAY_NAMES } from '@/lib/types';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  one_line_pitch: z.string().min(1, 'One-line pitch is required'),
  stage: z.string().min(1, 'Stage is required'),
  sector: z.array(z.string()).min(1, 'At least one sector is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  founded_date: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyEditPage() {
  const [, params] = useRoute('/company/:id/edit');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const selectedStage = watch('stage');
  const selectedSectors = watch('sector') || [];

  useEffect(() => {
    async function loadCompany() {
      if (!params?.id) return;

      try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
          setLocation('/auth/sign-in');
          return;
        }
        setCurrentUser(user);

        // Fetch company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', params.id)
          .single();

        if (companyError || !companyData) {
          toast({
            title: 'Error',
            description: 'Company not found',
            variant: 'destructive',
          });
          setLocation('/feed');
          return;
        }

        // Check if user is a founder
        const { data: founderData } = await supabase
          .from('company_founders')
          .select('id')
          .eq('company_id', params.id)
          .eq('user_id', user.id)
          .single();

        if (!founderData) {
          toast({
            title: 'Unauthorized',
            description: 'Only founders can edit this company',
            variant: 'destructive',
          });
          setLocation(`/company/${params.id}`);
          return;
        }

        setCompany(companyData as Company);
        setLogoUrl(companyData.logo_url || '');

        // Populate form
        setValue('name', companyData.name);
        setValue('one_line_pitch', companyData.one_line_pitch || '');
        setValue('stage', companyData.stage || '');
        setValue('sector', companyData.sector || []);
        setValue('website', companyData.website || '');
        setValue('location', companyData.location || '');
        setValue('founded_date', companyData.founded_date || '');
        setValue('description', companyData.description || '');
        setValue('logo_url', companyData.logo_url || '');
      } catch (error) {
        console.error('Error loading company:', error);
        toast({
          title: 'Error',
          description: 'Failed to load company',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [params?.id, setLocation, toast, setValue]);

  const onSubmit = async (data: CompanyFormData) => {
    if (!params?.id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          one_line_pitch: data.one_line_pitch,
          stage: data.stage,
          sector: data.sector,
          website: data.website || null,
          location: data.location || null,
          founded_date: data.founded_date || null,
          description: data.description || null,
          logo_url: logoUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company updated successfully',
      });

      setLocation(`/company/${params.id}`);
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update company',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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

  if (!company) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setLocation(`/company/${params?.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Company
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Edit Company</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <FileUpload
                    bucket="company-logos"
                    currentUrl={logoUrl}
                    onUploadComplete={(url) => {
                      setLogoUrl(url);
                      setValue('logo_url', url);
                    }}
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Acme Inc."
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* One-line Pitch */}
                <div className="space-y-2">
                  <Label htmlFor="one_line_pitch">One-line Pitch *</Label>
                  <Input
                    id="one_line_pitch"
                    {...register('one_line_pitch')}
                    placeholder="We're building the future of..."
                  />
                  {errors.one_line_pitch && (
                    <p className="text-sm text-destructive">{errors.one_line_pitch.message}</p>
                  )}
                </div>

                {/* Stage */}
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage *</Label>
                  <Select
                    value={selectedStage}
                    onValueChange={(value) => setValue('stage', value)}
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
                    <p className="text-sm text-destructive">{errors.stage.message}</p>
                  )}
                </div>

                {/* Sectors */}
                <div className="space-y-2">
                  <Label>Sectors *</Label>
                  <MultiSelect
                    options={SECTORS as unknown as string[]}
                    value={selectedSectors}
                    onChange={(sectors) => setValue('sector', sectors)}
                    placeholder="Select sectors"
                  />
                  {errors.sector && (
                    <p className="text-sm text-destructive">{errors.sector.message}</p>
                  )}
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    {...register('website')}
                    placeholder="https://example.com"
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive">{errors.website.message}</p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...register('location')}
                    placeholder="San Francisco, CA"
                  />
                </div>

                {/* Founded Date */}
                <div className="space-y-2">
                  <Label htmlFor="founded_date">Founded Date</Label>
                  <Input
                    id="founded_date"
                    type="date"
                    {...register('founded_date')}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Tell us more about your company..."
                    rows={6}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation(`/company/${params?.id}`)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

