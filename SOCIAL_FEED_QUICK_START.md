# Social Feed - Quick Start Guide

## 🚀 Getting Started

### For Founders

#### Creating Your First Post
1. Navigate to `/feed` in your browser
2. Click the blue **+** button in the bottom-right corner
3. Fill out the form:
   - **Company**: Select your company (auto-selected if you only have one)
   - **Post Type**: Choose "General Update" or "Milestone"
   - **Milestone Type**: If you selected "Milestone", choose the type
   - **Content**: Write your update (max 2000 characters)
   - **Images**: Optionally add up to 3 images (5MB max each)
4. Click **Post** to publish

#### Example Posts

**Product Launch:**
```
Post Type: Milestone
Milestone Type: Product Launch
Content: 
"🎉 We're thrilled to announce the launch of our MVP! 

After 6 months of development, we're ready to share our vision with the world. Check out the screenshots below to see what we've built.

Try it out at: https://your-product.com"

Images: [Product screenshot 1, Product screenshot 2]
```

**Team Update:**
```
Post Type: Milestone
Milestone Type: Team Hire
Content:
"Excited to welcome Sarah Chen as our new Head of Engineering! 🎊

Sarah brings 15 years of experience from Google and Stripe. We're lucky to have her leading our technical team as we scale."

Images: [Team photo]
```

**General Update:**
```
Post Type: General Update
Content:
"Quick update on our progress this month:

✅ Closed 50 new customers
✅ Hit $10k MRR
✅ Featured in TechCrunch

Thanks to all our investors and supporters who believed in us from day one!"
```

#### Editing a Post
1. Find your post in the feed
2. Click the **⋯** menu in the top-right corner of the post
3. Select **Edit Post**
4. Make your changes
5. Click **Save Changes**

#### Deleting a Post
1. Find your post in the feed
2. Click the **⋯** menu in the top-right corner of the post
3. Select **Delete Post** (red text)
4. Confirm the deletion in the dialog

**⚠️ Warning:** Deletion is permanent and cannot be undone!

---

### For Investors

#### Viewing Updates from Companies You Follow

1. Navigate to `/feed`
2. Click the **Following** tab
3. Scroll to see updates from companies you follow
4. Posts load automatically as you scroll (infinite scroll)

**Empty Feed?**
- If you see "Your feed is empty", you're not following any companies yet
- Click **Discover Companies** to browse and follow companies

#### Viewing All Posts

1. Navigate to `/feed`
2. Click the **Trending** tab
3. See all posts from every company, ordered by newest first

#### Interacting with Posts

**Currently Available:**
- Click on a **company logo** or **name** to visit their company page
- Click on an **author name** to visit their profile
- Click on **images** to view them full-screen (click anywhere to close)
- Read full posts by clicking **Read more** on truncated content

**Coming Soon (Stage 5):**
- Like/react to posts ❤️
- Comment on posts 💬
- Share posts 🔗

---

## 📱 Navigation

### URL Structure
- **Following Tab:** `/feed?tab=following`
- **Trending Tab:** `/feed?tab=trending`

The URL updates automatically when you switch tabs, so you can bookmark specific tabs or share links with the correct tab selected.

### Tab Behavior
- **Default for investors with follows:** Following tab
- **Default for investors without follows:** Trending tab
- **Default for new users:** Trending tab

---

## 🎨 Milestone Badge Colors

When creating a milestone post, you'll see a colored badge on the post:

- 🔵 **Product Launch** - Blue
- 🟢 **Revenue Milestone** - Green
- 🟣 **Team Hire** - Purple
- 🟡 **Funding Announcement** - Yellow
- 🔷 **Feature Release** - Cyan

These badges help investors quickly identify important company milestones in their feed.

---

## 📸 Image Guidelines

### Supported Formats
- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)

### Limitations
- **Max images per post:** 3
- **Max file size per image:** 5MB
- **Recommended dimensions:** 1200x800px or higher for best quality

### Image Layout
- **1 image:** Displays large (max 400px height)
- **2 images:** Side-by-side grid
- **3 images:** 2-column grid

### Tips for Great Images
- Use high-quality screenshots for product launches
- Include team photos for team updates
- Add graphs/charts for milestone announcements
- Ensure images are well-lit and clearly visible
- Avoid text-heavy images (put text in the post content instead)

---

## 🔔 Real-time Notifications

The feed updates automatically when new posts are published:

- **You'll see:** A toast notification in the top-right corner
- **Message:** "New post from [Company Name]!"
- **Behavior:** The new post appears at the top of your feed instantly

**Note:** You won't receive notifications for your own posts.

---

## 🔒 Privacy & Security

### Who Can See Posts?
- **All posts are public** and visible to all logged-in users
- Posts appear in both Following and Trending feeds
- Posts are visible on company pages

### Who Can Create Posts?
- Only **founders** can create posts
- Founders can only post on behalf of their own companies
- If you have multiple companies, you can choose which one to post for

### Who Can Edit/Delete Posts?
- Only the **original author** of a post can edit or delete it
- Other founders at the same company **cannot** edit/delete your posts
- Investors **cannot** edit/delete any posts

### Image Storage
- Images are stored securely in Supabase Storage
- Images are publicly accessible via URL (for viewing in feed)
- Only authenticated users can upload images
- Only post authors can delete images

---

## 💡 Best Practices

### For Founders

#### Posting Frequency
- **Sweet spot:** 1-3 posts per week
- **Too little:** Less than 1 per month (investors may lose interest)
- **Too much:** More than 1 per day (may feel spammy)

#### Content Guidelines
- ✅ Be authentic and transparent
- ✅ Share both wins and learnings
- ✅ Use milestones for significant updates
- ✅ Include visuals when possible
- ✅ Engage with your audience (coming in Stage 5)
- ❌ Don't overhype or exaggerate
- ❌ Don't share confidential information
- ❌ Don't post duplicate content

#### What to Post About
- **Product updates:** New features, launches, improvements
- **Team updates:** New hires, team milestones, culture
- **Business metrics:** Revenue, users, growth (if comfortable)
- **Fundraising:** Announcement of raises, terms (if public)
- **Customer wins:** Case studies, testimonials, logos
- **Challenges:** Problems you're solving, lessons learned
- **Recognition:** Press coverage, awards, partnerships

#### Content Length
- **Ideal:** 150-500 characters (2-4 sentences)
- **Short posts:** Quick updates, single stat
- **Long posts:** Detailed announcements, stories
- **Max:** 2000 characters (about 300 words)

### For Investors

#### Following Strategy
- Follow companies you've invested in
- Follow companies you're actively tracking
- Follow companies in your thesis areas
- Unfollow companies that are no longer relevant

#### Engagement (Coming Soon)
- Like posts to show support
- Comment to ask questions or provide feedback
- Share posts with other investors in your network

---

## 🐛 Troubleshooting

### "Your feed is empty" on Following tab
**Problem:** No posts are showing in your Following feed.  
**Solution:** 
1. Make sure you're following at least one company
2. Go to `/companies` to discover and follow companies
3. Check that the companies you follow have posted recently

### Images not uploading
**Problem:** Image upload fails or shows an error.  
**Possible causes:**
- File is larger than 5MB (compress it)
- File is not PNG, JPEG, or WebP (convert it)
- Network connection is slow (try again)
- You've reached the 3-image limit (remove one first)

### "Post" button is disabled
**Problem:** Cannot click the Post button.  
**Solution:**
- Make sure you've written some content
- Content field cannot be empty
- Wait for images to finish uploading

### Post not appearing in feed
**Problem:** Just created a post but it's not showing.  
**Solution:**
1. Wait a few seconds (real-time may have a slight delay)
2. Refresh the page
3. Check that you're on the correct tab
4. Verify the post was created (check your company page)

### Can't edit or delete a post
**Problem:** The ⋯ menu doesn't appear on a post.  
**Solution:**
- Only post authors can edit/delete
- Make sure you're logged in as the author
- Other founders at the same company cannot edit your posts

---

## 🎯 Quick Reference

### Keyboard Shortcuts
*Coming in future update*

### Character Limits
- Post content: **2000 characters**
- Company name (in selector): No limit

### File Limits
- Images per post: **3 max**
- Image file size: **5MB max**
- Total storage: *Unlimited for now*

### Tab Shortcuts
- Following feed: `/feed?tab=following`
- Trending feed: `/feed?tab=trending`

---

## 🆘 Need Help?

### Common Questions

**Q: Can I schedule posts?**  
A: Not yet. This feature is planned for a future update.

**Q: Can I tag other users in posts?**  
A: Not yet. Mentions are planned for Stage 5.

**Q: Can I see who viewed my post?**  
A: Not yet. Analytics are planned for a future update.

**Q: Can I pin a post to the top of my feed?**  
A: Not yet. This feature may be added in the future.

**Q: Can I draft posts?**  
A: Not yet. Currently all posts are published immediately.

**Q: Can multiple founders post from the same company?**  
A: Yes! Any founder at a company can create posts.

**Q: Will investors see all my posts?**  
A: Investors who follow your company will see your posts in their Following tab. All investors can see your posts in the Trending tab.

---

## 📞 Support

If you encounter any issues or have questions:
1. Check this guide first
2. Check the main documentation: `SOCIAL_FEED_IMPLEMENTATION.md`
3. Contact your platform administrator

---

**Last Updated:** October 1, 2025  
**Version:** 1.0  
**Status:** Live and ready to use!

