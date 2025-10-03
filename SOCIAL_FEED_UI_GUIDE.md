# Social Feed - UI/UX Visual Guide

## 📱 Page Layouts

### Feed Page Structure

```
┌──────────────────────────────────────────────────────────────┐
│ [Navigation Bar]                                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Feed                                                         │
│  ┌─────────────────────┬──────────────────────┐             │
│  │  Following  (active)│      Trending        │             │
│  └─────────────────────┴──────────────────────┘             │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │ [Post Card 1]                                       │     │
│  │ ┌──┐ Jane Doe · TechCorp     [Product Launch] [⋯]  │     │
│  │ │🏢│ 2 hours ago                                    │     │
│  │ └──┘                                                │     │
│  │                                                     │     │
│  │ Excited to announce our MVP launch! 🎉            │     │
│  │ After 6 months of development...                   │     │
│  │                                                     │     │
│  │ ┌──────────┐ ┌──────────┐                         │     │
│  │ │ Image 1  │ │ Image 2  │                         │     │
│  │ └──────────┘ └──────────┘                         │     │
│  │                                                     │     │
│  │ ❤ 0   💬 0   🔗                                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │ [Post Card 2]                                       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │ [Post Card 3]                                       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│                                             ┌───────┐        │
│                                             │  [+]  │        │
│                                             └───────┘        │
│                                          (Floating Button)   │
└──────────────────────────────────────────────────────────────┘
```

### Empty State - Following Tab

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                         ┌─────┐                              │
│                         │ 👥  │  (Users Icon)                │
│                         └─────┘                              │
│                                                               │
│                   Your feed is empty                         │
│                                                               │
│           Follow companies to see their updates here         │
│                                                               │
│                 ┌────────────────────────┐                   │
│                 │  Discover Companies    │                   │
│                 └────────────────────────┘                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Empty State - Trending Tab (Founder View)

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                         ┌─────┐                              │
│                         │ 📄  │  (FileText Icon)             │
│                         └─────┘                              │
│                                                               │
│                      No posts yet                            │
│                                                               │
│              Be the first to share an update!                │
│                                                               │
│                 ┌────────────────────────┐                   │
│                 │     Create Post        │                   │
│                 └────────────────────────┘                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Post Card Variations

### Standard Post Card

```
┌────────────────────────────────────────────────────────┐
│ ┌──┐ John Smith · StartupX                        [⋯]  │
│ │🏢│ 3 hours ago                                        │
│ └──┘                                                    │
│                                                         │
│ Quick update on our progress this month:               │
│                                                         │
│ ✅ Closed 50 new customers                            │
│ ✅ Hit $10k MRR                                        │
│ ✅ Featured in TechCrunch                             │
│                                                         │
│ Thanks to all our supporters! 🙏                      │
│                                                         │
│ ────────────────────────────────────────────────────   │
│ ❤ 0   💬 0   🔗                                        │
└────────────────────────────────────────────────────────┘
```

### Post with Milestone Badge

```
┌────────────────────────────────────────────────────────┐
│ ┌──┐ Sarah Chen · AI Labs          [🟢 Revenue]  [⋯]  │
│ │🏢│ 1 day ago                                          │
│ └──┘                                                    │
│                                                         │
│ Huge milestone! 💰 We just crossed $100K MRR!         │
│                                                         │
│ This represents 3x growth in just 2 months.            │
│ Thank you to our early customers for believing in us!  │
│                                                         │
│ ────────────────────────────────────────────────────   │
│ ❤ 0   💬 0   🔗                                        │
└────────────────────────────────────────────────────────┘
```

### Post with Single Image

```
┌────────────────────────────────────────────────────────┐
│ ┌──┐ Mike Johnson · DevTools      [🔵 Product]   [⋯]  │
│ │🏢│ 2 hours ago                                        │
│ └──┘                                                    │
│                                                         │
│ 🎉 Excited to share our new dashboard design!         │
│                                                         │
│ ┌────────────────────────────────────────────────┐    │
│ │                                                 │    │
│ │                                                 │    │
│ │           [Large Product Screenshot]           │    │
│ │                                                 │    │
│ │                                                 │    │
│ └────────────────────────────────────────────────┘    │
│                                                         │
│ ────────────────────────────────────────────────────   │
│ ❤ 0   💬 0   🔗                                        │
└────────────────────────────────────────────────────────┘
```

### Post with Multiple Images

```
┌────────────────────────────────────────────────────────┐
│ ┌──┐ Lisa Wong · DesignCo         [🟣 Team Hire] [⋯]  │
│ │🏢│ Yesterday                                          │
│ └──┘                                                    │
│                                                         │
│ Welcome to the team! 🎊 We just hired 3 amazing       │
│ engineers from Google, Meta, and Stripe.               │
│                                                         │
│ ┌──────────────────┐ ┌──────────────────┐            │
│ │                   │ │                   │            │
│ │  [Team Photo 1]   │ │  [Team Photo 2]   │            │
│ │                   │ │                   │            │
│ └──────────────────┘ └──────────────────┘            │
│ ┌──────────────────┐                                   │
│ │                   │                                   │
│ │  [Team Photo 3]   │                                   │
│ │                   │                                   │
│ └──────────────────┘                                   │
│                                                         │
│ ────────────────────────────────────────────────────   │
│ ❤ 0   💬 0   🔗                                        │
└────────────────────────────────────────────────────────┘
```

### Post with Truncated Content

```
┌────────────────────────────────────────────────────────┐
│ ┌──┐ Alex Rivera · DataFlow                       [⋯]  │
│ │🏢│ 5 hours ago                                        │
│ └──┘                                                    │
│                                                         │
│ I wanted to share a detailed update on what we've      │
│ been building over the past quarter. We've made        │
│ incredible progress on multiple fronts including       │
│ product development, customer acquisition, and team    │
│ growth. Our revenue has grown 10x and we're now        │
│ serving over 500 customers across 20 countries...     │
│                                                         │
│ Read more →                                            │
│                                                         │
│ ────────────────────────────────────────────────────   │
│ ❤ 0   💬 0   🔗                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 Modal Designs

### Create Post Modal

```
┌──────────────────────────────────────────────────────────┐
│ Create Post                                          [✕] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Company                                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ TechCorp                                      ▼   │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ Post Type                                                 │
│ ⦿ General Update     ○ Milestone                         │
│                                                           │
│ Content                                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Share an update with investors...                 │   │
│ │                                                   │   │
│ │                                                   │   │
│ │                                                   │   │
│ └───────────────────────────────────────────────────┘   │
│                                            0 / 2000      │
│                                                           │
│ Images (Optional)                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │         📷  Add Images (0/3)                     │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                              [ Cancel ]  [ Post ]        │
└──────────────────────────────────────────────────────────┘
```

### Create Post Modal - Milestone Selected

```
┌──────────────────────────────────────────────────────────┐
│ Create Post                                          [✕] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Company                                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ TechCorp                                          │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ Post Type                                                 │
│ ○ General Update     ⦿ Milestone                         │
│                                                           │
│ Milestone Type                                            │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Product Launch                                ▼   │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ Content                                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🎉 We just launched our MVP!                     │   │
│ │                                                   │   │
│ │ After 6 months of development...                 │   │
│ │                                                   │   │
│ └───────────────────────────────────────────────────┘   │
│                                            127 / 2000     │
│                                                           │
│ Images (Optional)                                         │
│ ┌─────────┐ ┌─────────┐                                 │
│ │ [Prev1] │ │ [Prev2] │                                 │
│ │    ✕    │ │    ✕    │                                 │
│ └─────────┘ └─────────┘                                 │
│ ┌───────────────────────────────────────────────────┐   │
│ │         📷  Add Images (2/3)                     │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                              [ Cancel ]  [ Post ]        │
└──────────────────────────────────────────────────────────┘
```

### Edit Post Modal

```
┌──────────────────────────────────────────────────────────┐
│ Edit Post                                            [✕] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Company                                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ TechCorp                     (read-only)          │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ Post Type                                                 │
│ ⦿ General Update     ○ Milestone                         │
│                                                           │
│ Content                                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Quick update on our progress this month:          │   │
│ │                                                   │   │
│ │ ✅ Closed 50 new customers                       │   │
│ │ ✅ Hit $10k MRR                                  │   │
│ └───────────────────────────────────────────────────┘   │
│                                            156 / 2000     │
│                                                           │
│ Images                                                    │
│ Current Images                                            │
│ ┌─────────┐ ┌─────────┐                                 │
│ │ [Img 1] │ │ [Img 2] │                                 │
│ │    ✕    │ │    ✕    │                                 │
│ └─────────┘ └─────────┘                                 │
│ ┌───────────────────────────────────────────────────┐   │
│ │         📷  Add Images (2/3)                     │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                        [ Cancel ]  [ Save Changes ]      │
└──────────────────────────────────────────────────────────┘
```

### Delete Confirmation Dialog

```
            ┌────────────────────────────────┐
            │ Delete Post                    │
            ├────────────────────────────────┤
            │                                │
            │ Are you sure you want to       │
            │ delete this post?              │
            │                                │
            │ This action cannot be undone.  │
            │                                │
            ├────────────────────────────────┤
            │     [ Cancel ]  [ Delete ]     │
            └────────────────────────────────┘
```

---

## 🎨 Component States

### Floating Action Button (FAB)

**Normal State:**
```
    ┌─────┐
    │  +  │  ← Blue background
    └─────┘     White icon
                Drop shadow
```

**Hover State:**
```
    ┌─────┐
    │  +  │  ← Darker blue
    └─────┘     Larger shadow
                Slight scale up
```

**Position:**
- Bottom-right corner of screen
- 32px from bottom, 32px from right
- Fixed position (stays on screen during scroll)

### Post Action Buttons

**Like Button (Disabled):**
```
❤ 0  ← Gray color, no interaction
```

**Comment Button (Disabled):**
```
💬 0  ← Gray color, no interaction
```

**Share Button (Disabled):**
```
🔗   ← Gray color, no interaction
```

**Hover State (all buttons):**
```
Tooltip appears: "Coming soon"
```

### More Menu (⋯)

**Closed:**
```
[⋯]  ← Small gray button
```

**Open (Author's post):**
```
┌──────────────┐
│ Edit Post    │
├──────────────┤
│ Delete Post  │  ← Red text
└──────────────┘
```

---

## 📱 Responsive Breakpoints

### Mobile (< 640px)

```
┌────────────────────────┐
│ [Nav]                  │
├────────────────────────┤
│ Feed                   │
│ ┌──────────┬──────────┐│
│ │Following │ Trending ││
│ └──────────┴──────────┘│
│                        │
│ ┌────────────────────┐ │
│ │ [Post Card]        │ │
│ │ (Full width)       │ │
│ └────────────────────┘ │
│                        │
│              ┌───┐     │
│              │ + │     │
│              └───┘     │
└────────────────────────┘
```

### Tablet (640px - 1024px)

```
┌──────────────────────────────────┐
│ [Navigation Bar]                 │
├──────────────────────────────────┤
│  Feed                            │
│  ┌──────────┬─────────────┐     │
│  │Following │  Trending   │     │
│  └──────────┴─────────────┘     │
│                                  │
│  ┌────────────────────────┐     │
│  │ [Post Card]            │     │
│  │ (Max-width container)  │     │
│  └────────────────────────┘     │
│                                  │
│                     ┌───┐        │
│                     │ + │        │
│                     └───┘        │
└──────────────────────────────────┘
```

### Desktop (> 1024px)

```
┌────────────────────────────────────────────────┐
│ [Navigation Bar]                               │
├────────────────────────────────────────────────┤
│                                                │
│    Feed                                        │
│    ┌──────────┬─────────────┐                 │
│    │Following │  Trending   │                 │
│    └──────────┴─────────────┘                 │
│                                                │
│    ┌──────────────────────────────┐           │
│    │ [Post Card]                  │           │
│    │ (Centered, max 768px width)  │           │
│    └──────────────────────────────┘           │
│                                                │
│                            ┌───┐              │
│                            │ + │              │
│                            └───┘              │
└────────────────────────────────────────────────┘
```

---

## 🎨 Milestone Badge Colors

### All Badge Styles

**Product Launch (Blue):**
```
┌──────────────────┐
│ Product Launch   │  ← Light blue background
└──────────────────┘     Blue text, blue border
```

**Revenue Milestone (Green):**
```
┌──────────────────────┐
│ Revenue Milestone    │  ← Light green background
└──────────────────────┘     Green text, green border
```

**Team Hire (Purple):**
```
┌──────────────┐
│ Team Hire    │  ← Light purple background
└──────────────┘     Purple text, purple border
```

**Funding Announcement (Yellow):**
```
┌──────────────────────────┐
│ Funding Announcement     │  ← Light yellow background
└──────────────────────────┘     Yellow text, yellow border
```

**Feature Release (Cyan):**
```
┌──────────────────┐
│ Feature Release  │  ← Light cyan background
└──────────────────┘     Cyan text, cyan border
```

---

## 🔔 Toast Notifications

### Success Toast (Post Created)
```
┌───────────────────────────────┐
│ ✓ Post published!             │
│   Your post has been shared   │
│   successfully.               │
└───────────────────────────────┘
```

### Success Toast (Post Deleted)
```
┌───────────────────────────────┐
│ ✓ Post deleted                │
│   Your post has been removed. │
└───────────────────────────────┘
```

### New Post Notification (Real-time)
```
┌───────────────────────────────┐
│ ℹ New post                    │
│   TechCorp shared an update   │
└───────────────────────────────┘
```

### Error Toast (Upload Failed)
```
┌───────────────────────────────┐
│ ✕ File too large              │
│   image.png exceeds the 5MB   │
│   size limit.                 │
└───────────────────────────────┘
```

---

## 🖼️ Image Display Layouts

### Single Image Layout
```
┌────────────────────────────────────┐
│                                    │
│                                    │
│         [Large Image]              │
│         (Max 400px height)         │
│                                    │
│                                    │
└────────────────────────────────────┘
```

### Two Images Layout
```
┌─────────────────┐ ┌─────────────────┐
│                 │ │                 │
│   [Image 1]     │ │   [Image 2]     │
│  (Square grid)  │ │  (Square grid)  │
│                 │ │                 │
└─────────────────┘ └─────────────────┘
```

### Three Images Layout
```
┌─────────────────┐ ┌─────────────────┐
│                 │ │                 │
│   [Image 1]     │ │   [Image 2]     │
│  (Square grid)  │ │  (Square grid)  │
│                 │ │                 │
└─────────────────┘ └─────────────────┘
┌─────────────────┐
│                 │
│   [Image 3]     │
│  (Square grid)  │
│                 │
└─────────────────┘
```

### Full-screen Lightbox
```
┌────────────────────────────────────────────────┐
│ [×]  ← Close button (top-right)                │
│                                                │
│                                                │
│                                                │
│            [Full-size Image]                   │
│            (Centered, max size)                │
│                                                │
│                                                │
│                                                │
└────────────────────────────────────────────────┘
     (Dark overlay, click anywhere to close)
```

---

## 🎭 Interaction Animations

### Card Hover Effect
- **Before:** Base shadow (sm)
- **On Hover:** Increased shadow (md)
- **Transition:** 200ms ease

### Button Hover Effects
- **FAB:** Scale 1.05, shadow increase
- **Post Button:** Background darkens
- **Cancel Button:** Background lightens

### Image Preview Hover
- **Overlay:** Slight opacity change
- **Cursor:** Pointer
- **Hint:** "Click to view full size"

### Loading States
- **Infinite Scroll:** Spinner at bottom
- **Modal Submit:** Button shows spinner + "Posting..." text
- **Initial Load:** Full-page centered spinner

---

## 📏 Spacing & Sizing

### Post Card Spacing
- **Padding:** 16px all sides
- **Gap between cards:** 16px vertical
- **Border:** 1px solid gray-200
- **Border radius:** 8px

### Modal Sizing
- **Max width:** 672px (2xl)
- **Max height:** 90vh
- **Padding:** 24px
- **Overflow:** Scroll if needed

### FAB Sizing
- **Dimension:** 56px × 56px
- **Icon size:** 24px
- **Border radius:** Full (circle)
- **Position:** Bottom-right (32px from edges)

---

This visual guide provides a complete reference for the UI/UX design of the social feed system. Use it for consistency when making future updates or additions to the feature.

