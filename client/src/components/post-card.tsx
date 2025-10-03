import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Heart, MessageCircle, Share2, MoreVertical, Loader2 } from 'lucide-react';
import { PostWithDetails, MILESTONE_TAGS, CommentWithAuthor } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Engagement state
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [displayedCommentsCount, setDisplayedCommentsCount] = useState(10);

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

  // Load engagement data
  useEffect(() => {
    loadEngagementData();
    
    // Subscribe to real-time updates
    const likesChannel = supabase
      .channel(`post_${post.id}_likes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes',
        filter: `post_id=eq.${post.id}`
      }, () => {
        loadEngagementData();
      })
      .subscribe();

    const commentsChannel = supabase
      .channel(`post_${post.id}_comments`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_comments',
        filter: `post_id=eq.${post.id}`
      }, () => {
        loadEngagementData();
        if (showComments) {
          loadComments();
        }
      })
      .subscribe();

    return () => {
      likesChannel.unsubscribe();
      commentsChannel.unsubscribe();
    };
  }, [post.id, currentUserId]);

  // Load comments when section is expanded
  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadEngagementData = async () => {
    try {
      // Get like count
      const { count: likes } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      
      setLikeCount(likes || 0);

      // Check if current user liked
      if (currentUserId) {
        const { data: userLike } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', currentUserId)
          .single();
        
        setUserHasLiked(!!userLike);
      }

      // Get comment count
      const { count: comments } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      
      setCommentCount(comments || 0);
    } catch (error) {
      console.error('Error loading engagement data:', error);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:users(*)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data as CommentWithAuthor[]);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentUserId || isLiking) return;

    setIsLiking(true);
    
    // Optimistic update
    const newLikedState = !userHasLiked;
    const newCount = newLikedState ? likeCount + 1 : likeCount - 1;
    setUserHasLiked(newLikedState);
    setLikeCount(newCount);

    try {
      if (newLikedState) {
        // Add like
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: currentUserId });
        
        if (error) throw error;
      } else {
        // Remove like
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
        
        if (error) throw error;
      }
    } catch (error) {
      // Revert optimistic update on error
      setUserHasLiked(!newLikedState);
      setLikeCount(likeCount);
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handlePostComment = async () => {
    if (!currentUserId || !commentText.trim() || isPostingComment) return;

    setIsPostingComment(true);

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: commentText.trim(),
        })
        .select(`
          *,
          author:users(*)
        `)
        .single();

      if (error) throw error;

      // Add comment to list
      setComments([...comments, data as CommentWithAuthor]);
      setCommentCount(commentCount + 1);
      setCommentText('');
      
      toast({
        title: 'Comment posted',
        description: 'Your comment has been added',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentText.trim() || !currentUserId) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .update({
          content: editingCommentText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', currentUserId); // Security check

      if (error) throw error;

      // Update comment in list
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, content: editingCommentText.trim(), updated_at: new Date().toISOString() }
          : c
      ));
      
      setEditingCommentId(null);
      setEditingCommentText('');
      
      toast({
        title: 'Comment updated',
        description: 'Your changes have been saved',
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingCommentId || !currentUserId) return;

    try {
      // Type guard to ensure currentUserId is a string
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', deletingCommentId)
        .eq('user_id', currentUserId as string); // Security check

      if (error) throw error;

      // Remove comment from list
      setComments(comments.filter(c => c.id !== deletingCommentId));
      setCommentCount(commentCount - 1);
      
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been removed',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

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

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = Date.now();
    const diff = now - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return format(date, 'MMM d, yyyy');
  };

  const displayedComments = comments.slice(0, displayedCommentsCount);
  const hasMoreComments = comments.length > displayedCommentsCount;

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
                    onClick={() => post.author_id && setLocation(`/profile/${post.author_id}`)}
                    className="font-semibold hover:underline truncate"
                  >
                    {post.author.full_name || 'Anonymous'}
                  </button>
                  {post.company && (
                    <>
                      <span className="text-slate-400">·</span>
                      <button
                        onClick={() => post.company_id && setLocation(`/company/${post.company_id}`)}
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
              className={`${
                userHasLiked 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-slate-600 hover:text-red-600'
              }`}
              onClick={handleLikeToggle}
              disabled={!currentUserId || isLiking}
            >
              <Heart className={`h-4 w-4 mr-1.5 ${userHasLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`${
                showComments
                  ? 'text-blue-600 hover:text-blue-700'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className={`h-4 w-4 mr-1.5 ${showComments ? 'fill-current' : ''}`} />
              <span className="text-sm">{commentCount}</span>
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

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Comment Input */}
              {currentUserId && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[80px] resize-none"
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {commentText.length}/500
                      </span>
                      <div className="flex gap-2">
                        {commentText && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCommentText('');
                              if (commentCount === 0) setShowComments(false);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={handlePostComment}
                          disabled={!commentText.trim() || isPostingComment}
                        >
                          {isPostingComment && (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          )}
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {displayedComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar 
                        className="h-8 w-8 flex-shrink-0 cursor-pointer"
                        onClick={() => setLocation(`/profile/${comment.user_id}`)}
                      >
                        <AvatarImage src={comment.author.avatar_url || undefined} />
                        <AvatarFallback>
                          {comment.author.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <button
                              onClick={() => setLocation(`/profile/${comment.user_id}`)}
                              className="font-medium text-sm hover:underline"
                            >
                              {comment.author.full_name || 'Anonymous'}
                            </button>
                            {currentUserId === comment.user_id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingCommentText(comment.content);
                                    }}
                                  >
                                    Edit Comment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeletingCommentId(comment.id)}
                                    className="text-red-600"
                                  >
                                    Delete Comment
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="min-h-[60px] resize-none"
                                maxLength={500}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditComment(comment.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingCommentText('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {comment.content}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-3">
                          <span className="text-xs text-muted-foreground">
                            {formatCommentTime(comment.created_at)}
                          </span>
                          {comment.updated_at !== comment.created_at && (
                            <span className="text-xs text-muted-foreground">
                              (edited)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {hasMoreComments && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDisplayedCommentsCount(displayedCommentsCount + 10)}
                      className="w-full"
                    >
                      Load more comments
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              )}
            </div>
          )}
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

      {/* Delete Comment Confirmation */}
      <AlertDialog open={!!deletingCommentId} onOpenChange={() => setDeletingCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteComment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
