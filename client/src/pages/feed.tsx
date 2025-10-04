import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/supabase';
import { Navigation } from '@/components/navigation';
import { PostCard } from '@/components/post-card';
import { CreatePostModal } from '@/components/create-post-modal';
import { EditPostModal } from '@/components/edit-post-modal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { Loader2, Plus, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PostWithDetails } from '@/lib/types';

const POSTS_PER_PAGE = 20;

export default function FeedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'following' | 'trending'>('trending');
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasFollows, setHasFollows] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostWithDetails | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const realtimeSubscriptionRef = useRef<any>(null);

  // Check auth and load initial data
  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setLocation('/auth/sign-in');
        return;
      }
      setUser(currentUser);

      // Check if user follows any companies
      const { count } = await supabase
        .from('company_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', currentUser.id);

      const follows = (count || 0) > 0;
      setHasFollows(follows);
      
      // Default to following tab if user has follows, else trending
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab') as 'following' | 'trending';
      if (tab === 'following' || tab === 'trending') {
        setActiveTab(tab);
      } else {
        setActiveTab(follows ? 'following' : 'trending');
      }

      setLoading(false);
    }
    loadUser();
  }, [setLocation]);

  // Load posts when tab changes
  useEffect(() => {
    if (user) {
      loadPosts(true);
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url);
    }
  }, [activeTab, user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          // Fetch full post data with author and company
          const { data: newPost } = await supabase
            .from('posts')
            .select(`
              *,
              author:users(*),
              company:companies(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newPost) {
            // Only add to feed if it matches current tab
            const shouldAdd = 
              activeTab === 'trending' || 
              (activeTab === 'following' && newPost.company_id && await isFollowingCompany(newPost.company_id));

            if (shouldAdd) {
              setPosts(prev => [newPost as PostWithDetails, ...prev]);
              
              // Show toast notification
              if (newPost.author_id !== user.id) {
                toast({
                  title: 'New post',
                  description: `${newPost.company?.name || 'A company'} shared an update`,
                });
              }
            }
          }
        }
      )
      .subscribe();

    realtimeSubscriptionRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user, activeTab]);

  const isFollowingCompany = async (companyId: string | null) => {
    if (!companyId || !user) return false;
    const { data } = await supabase
      .from('company_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('company_id', companyId)
      .single();
    return !!data;
  };

  const loadPosts = async (reset = false) => {
    if (!user) return;
    
    if (reset) {
      setPosts([]);
      setHasMore(true);
    }

    setLoadingMore(true);

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users(*),
          company:companies(*)
        `)
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_PAGE);

      // Apply filter based on tab
      if (activeTab === 'following') {
        // Get followed company IDs
        const { data: follows } = await supabase
          .from('company_follows')
          .select('company_id')
          .eq('follower_id', user.id);

        const followedIds = follows?.map(f => f.company_id) || [];
        
        if (followedIds.length === 0) {
          setPosts([]);
          setHasMore(false);
          setLoadingMore(false);
          return;
        }

        query = query.in('company_id', followedIds);
      }

      // Pagination
      if (!reset && posts.length > 0) {
        query = query.lt('created_at', posts[posts.length - 1].created_at);
      }

      const { data, error } = await query;

      if (error) throw error;

      const newPosts = data as unknown as PostWithDetails[];
      
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadPosts(false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, posts]);

  const handleDeletePost = async () => {
    if (!deletingPostId) return;

    try {
      // Get post to find media URLs
      const postToDelete = posts.find(p => p.id === deletingPostId);
      
      // Delete media files from storage
      if (postToDelete?.media_urls) {
        for (const url of postToDelete.media_urls) {
          try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/post-media/');
            if (pathParts.length > 1) {
              const filePath = pathParts[1];
              await supabase.storage.from('post-media').remove([filePath]);
            }
          } catch (error) {
            console.error('Error deleting media:', error);
          }
        }
      }

      // Delete post from database
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', deletingPostId)
        .eq('author_id', user?.id || ''); // Extra security check

      if (error) throw error;

      // Optimistic update
      setPosts(prev => prev.filter(p => p.id !== deletingPostId));
      
      toast({
        title: 'Post deleted',
        description: 'Your post has been removed.',
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive',
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  const refreshFeed = () => {
    loadPosts(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isFounder = user.user_type === 'founder';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Page Header */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'following' | 'trending')}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="following" className="flex-1 sm:flex-none">
                Following
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex-1 sm:flex-none">
                Trending
              </TabsTrigger>
            </TabsList>

            {/* Following Tab */}
            <TabsContent value="following" className="mt-6">
              {posts.length === 0 && !loadingMore ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="rounded-full bg-slate-100 p-4 mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Your feed is empty</h3>
                  <p className="text-slate-600 text-center mb-6">
                    Follow companies to see their updates here
                  </p>
                  <Button onClick={() => setLocation('/search?type=companies')}>
                    Search Companies
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user.id}
                      onEdit={setEditingPost}
                      onDelete={setDeletingPostId}
                    />
                  ))}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <div ref={observerTarget} className="h-4" />
                </div>
              )}
            </TabsContent>

            {/* Trending Tab */}
            <TabsContent value="trending" className="mt-6">
              {posts.length === 0 && !loadingMore ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="rounded-full bg-slate-100 p-4 mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-slate-600 text-center mb-6">
                    Be the first to share an update!
                  </p>
                  {isFounder && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      Create Post
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user.id}
                      onEdit={setEditingPost}
                      onDelete={setDeletingPostId}
                    />
                  ))}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <div ref={observerTarget} className="h-4" />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Floating Action Button (Founders Only) */}
      {isFounder && (
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="lg"
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          title="Create Post"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUserId={user.id}
        onSuccess={refreshFeed}
      />

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          isOpen={true}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          onSuccess={refreshFeed}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPostId} onOpenChange={() => setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
