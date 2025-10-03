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
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MILESTONE_TAGS, type MilestoneTag, type PostWithDetails } from '@/lib/types';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostWithDetails;
  onSuccess?: () => void;
}

export function EditPostModal({
  isOpen,
  onClose,
  post,
  onSuccess,
}: EditPostModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<'general' | 'milestone'>(
    post.post_type === 'milestone' ? 'milestone' : 'general'
  );
  const [milestoneTag, setMilestoneTag] = useState<MilestoneTag | ''>(
    (post.milestone_tag as MilestoneTag) || ''
  );
  const [content, setContent] = useState(post.content);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(
    post.media_urls || []
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const MAX_CHARS = 2000;
  const MAX_IMAGES = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const totalImages = existingMediaUrls.length + newImageFiles.length;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check file count
    if (totalImages + files.length > MAX_IMAGES) {
      toast({
        title: 'Too many images',
        description: `You can only have up to ${MAX_IMAGES} images per post.`,
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
          setNewImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setNewImageFiles(prev => [...prev, ...validFiles]);
  };

  const removeExistingImage = (index: number) => {
    setExistingMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async () => {
    const urls: string[] = [];

    for (const file of newImageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${post.company_id}/${post.id}/${fileName}`;

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

  const deleteRemovedImages = async () => {
    const originalUrls = post.media_urls || [];
    const removedUrls = originalUrls.filter(url => !existingMediaUrls.includes(url));

    for (const url of removedUrls) {
      try {
        // Extract path from URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/post-media/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          await supabase.storage.from('post-media').remove([filePath]);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please write something before saving.',
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
      // Delete removed images
      await deleteRemovedImages();

      // Upload new images
      const newMediaUrls = newImageFiles.length > 0 
        ? await uploadNewImages() 
        : [];

      // Combine existing and new URLs
      const allMediaUrls = [...existingMediaUrls, ...newMediaUrls];

      // Update post
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          content: content.trim(),
          post_type: postType,
          milestone_tag: postType === 'milestone' ? milestoneTag : null,
          media_urls: allMediaUrls.length > 0 ? allMediaUrls : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateError) throw updateError;

      toast({
        title: 'Post updated!',
        description: 'Your changes have been saved.',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update post. Please try again.',
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
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Company (read-only) */}
          {post.company && (
            <div>
              <Label>Company</Label>
              <div className="mt-2 px-3 py-2 bg-slate-50 rounded-md text-sm">
                {post.company.name}
              </div>
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

          {/* Image Management */}
          <div>
            <Label>Images</Label>
            <div className="mt-2 space-y-3">
              {/* Existing Images */}
              {existingMediaUrls.length > 0 && (
                <div>
                  <div className="text-sm text-slate-600 mb-2">Current Images</div>
                  <div className="grid grid-cols-3 gap-2">
                    {existingMediaUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {newImagePreviews.length > 0 && (
                <div>
                  <div className="text-sm text-slate-600 mb-2">New Images</div>
                  <div className="grid grid-cols-3 gap-2">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add More Images */}
              {totalImages < MAX_IMAGES && (
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
                    Add Images ({totalImages}/{MAX_IMAGES})
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
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

