import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MILESTONE_TAGS, type MilestoneTag } from '@/lib/types';

interface Company {
  id: string;
  name: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  currentUserId: string;
  onSuccess?: () => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  companyId,
  currentUserId,
  onSuccess,
}: CreatePostModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId || '');
  const [postType, setPostType] = useState<'general' | 'milestone'>('general');
  const [milestoneTag, setMilestoneTag] = useState<MilestoneTag | ''>('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const MAX_CHARS = 2000;
  const MAX_IMAGES = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Load founder's companies
  useEffect(() => {
    if (isOpen && !companyId) {
      loadCompanies();
    } else if (companyId) {
      setSelectedCompanyId(companyId);
    }
  }, [isOpen, companyId]);

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('company_founders')
      .select('company_id, companies(id, name)')
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error loading companies:', error);
      return;
    }

    const companiesList = data
      .map((cf: any) => cf.companies)
      .filter(Boolean);

    setCompanies(companiesList);
    if (companiesList.length === 1) {
      setSelectedCompanyId(companiesList[0].id);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check file count
    if (imageFiles.length + files.length > MAX_IMAGES) {
      toast({
        title: 'Too many images',
        description: `You can only upload up to ${MAX_IMAGES} images per post.`,
        variant: 'destructive',
      });
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file type
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported image format.`,
          variant: 'destructive',
        });
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 5MB size limit.`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
    }

    // Create previews
    const newPreviews: string[] = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImageFiles(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (postId: string) => {
    const urls: string[] = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedCompanyId}/${postId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }

    return urls;
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please write something before posting.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCompanyId) {
      toast({
        title: 'Company required',
        description: 'Please select a company.',
        variant: 'destructive',
      });
      return;
    }

    if (postType === 'milestone' && !milestoneTag) {
      toast({
        title: 'Milestone tag required',
        description: 'Please select a milestone type.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create post first to get ID
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: currentUserId,
          company_id: selectedCompanyId,
          content: content.trim(),
          post_type: postType,
          milestone_tag: postType === 'milestone' ? milestoneTag : null,
          media_urls: [], // Will update after upload
        })
        .select()
        .single();

      if (postError) throw postError;

      // Upload images if any
      let mediaUrls: string[] = [];
      if (imageFiles.length > 0) {
        mediaUrls = await uploadImages(post.id);
        
        // Update post with media URLs
        const { error: updateError } = await supabase
          .from('posts')
          .update({ media_urls: mediaUrls })
          .eq('id', post.id);

        if (updateError) throw updateError;
      }

      toast({
        title: 'Post published!',
        description: 'Your post has been shared successfully.',
      });

      // Reset form
      setContent('');
      setPostType('general');
      setMilestoneTag('');
      setImageFiles([]);
      setImagePreviews([]);
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Company Selector */}
          {!companyId && companies.length > 1 && (
            <div>
              <Label>Company</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Post Type */}
          <div>
            <Label>Post Type</Label>
            <RadioGroup
              value={postType}
              onValueChange={(value) => {
                setPostType(value as 'general' | 'milestone');
                if (value === 'general') setMilestoneTag('');
              }}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="general" id="general" />
                <Label htmlFor="general" className="font-normal cursor-pointer">
                  General Update
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="milestone" id="milestone" />
                <Label htmlFor="milestone" className="font-normal cursor-pointer">
                  Milestone
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Milestone Tag (if milestone selected) */}
          {postType === 'milestone' && (
            <div>
              <Label>Milestone Type</Label>
              <Select value={milestoneTag} onValueChange={(value) => setMilestoneTag(value as MilestoneTag)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MILESTONE_TAGS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Content */}
          <div>
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Share an update with investors..."
              className="min-h-[150px] mt-2"
            />
            <div className="text-sm text-slate-500 mt-1 text-right">
              {content.length} / {MAX_CHARS}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Images (Optional)</Label>
            <div className="mt-2">
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imagePreviews.length < MAX_IMAGES && (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <ImageIcon className="h-5 w-5 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    Add Images ({imagePreviews.length}/{MAX_IMAGES})
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Post'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

