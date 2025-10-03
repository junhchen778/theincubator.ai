import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import { PostWithDetails, MILESTONE_TAGS } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';

interface PostCardProps {
  post: PostWithDetails;
  currentUserId?: string;
  onEdit?: (post: PostWithDetails) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, currentUserId, onEdit, onDelete }: PostCardProps) {
  const [, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isAuthor = currentUserId === post.author_id;
  const shouldTruncate = post.content.length > 500 && !isExpanded;
  const displayContent = shouldTruncate 
    ? post.content.slice(0, 500) + '...' 
    : post.content;

  // Format timestamp
  const postDate = new Date(post.created_at);
  const isRecent = Date.now() - postDate.getTime() < 24 * 60 * 60 * 1000;
  const timestamp = isRecent
    ? formatDistanceToNow(postDate, { addSuffix: true })
    : format(postDate, 'MMM d, yyyy');

  // Get milestone badge color
  const getMilestoneColor = (tag: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    const milestoneInfo = MILESTONE_TAGS[tag as keyof typeof MILESTONE_TAGS];
    return milestoneInfo ? colors[milestoneInfo.color] : '';
  };

  // Linkify URLs in content
  const linkifyContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Company Logo */}
              {post.company && (
                <Avatar
                  className="h-12 w-12 cursor-pointer flex-shrink-0"
                  onClick={() => setLocation(`/company/${post.company_id}`)}
                >
                  <AvatarImage src={post.company.logo_url || undefined} />
                  <AvatarFallback>{post.company.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}

              {/* Author & Company Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setLocation(`/profile/${post.author_id}`)}
                    className="font-semibold hover:underline truncate"
                  >
                    {post.author.full_name || 'Anonymous'}
                  </button>
                  {post.company && (
                    <>
                      <span className="text-slate-400">·</span>
                      <button
                        onClick={() => setLocation(`/company/${post.company_id}`)}
                        className="text-slate-600 hover:underline truncate"
                      >
                        {post.company.name}
                      </button>
                    </>
                  )}
                </div>
                <div className="text-sm text-slate-500">{timestamp}</div>
              </div>
            </div>

            {/* Milestone Badge & Menu */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {post.milestone_tag && (
                <Badge
                  variant="outline"
                  className={getMilestoneColor(post.milestone_tag)}
                >
                  {MILESTONE_TAGS[post.milestone_tag as keyof typeof MILESTONE_TAGS]?.label}
                </Badge>
              )}

              {isAuthor && (onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(post)}>
                        Edit Post
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(post.id)}
                        className="text-red-600"
                      >
                        Delete Post
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mb-3">
            <p className="whitespace-pre-wrap break-words">
              {linkifyContent(displayContent)}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:underline text-sm mt-1"
              >
                Read more
              </button>
            )}
          </div>

          {/* Media Display */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className={`mb-3 ${
              post.media_urls.length === 1
                ? ''
                : post.media_urls.length === 2
                ? 'grid grid-cols-2 gap-2'
                : 'grid grid-cols-2 gap-2'
            }`}>
              {post.media_urls.map((url, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-lg cursor-pointer ${
                    post.media_urls!.length === 1 ? 'max-h-[400px]' : 'aspect-square'
                  }`}
                  onClick={() => setSelectedImage(url)}
                >
                  <img
                    src={url}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-red-600"
              disabled
              title="Coming soon"
            >
              <Heart className="h-4 w-4 mr-1.5" />
              <span className="text-sm">0</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-blue-600"
              disabled
              title="Coming soon"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              <span className="text-sm">0</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-green-600"
              disabled
              title="Coming soon"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lightbox for full-screen image */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-h-full max-w-full object-contain"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-slate-300"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

