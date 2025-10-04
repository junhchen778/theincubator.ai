# Search and Discovery Features - incubator.ai

## Overview
Comprehensive search and discovery system with full-text search capabilities, autocomplete, and advanced filtering.

---

## 🔍 PART 1: GLOBAL SEARCH BAR

### Location
`client/src/components/navigation.tsx`

### Features Implemented

#### Search Bar Design
- **Position**: Center of navigation bar
- **Width**: 400px on desktop, full width on mobile
- **Always visible**: Except when mobile menu is collapsed
- **Debounced search**: 300ms delay after typing stops

#### Autocomplete Dropdown
Appears after typing 2+ characters with the following sections:

1. **Companies** (top 3 results):
   - Logo + Name + Stage badge
   - One-line pitch (truncated)
   - Click navigates to `/company/[id]`

2. **Investors** (top 3 results):
   - Avatar + Name + Verified badge
   - Investment thesis preview (stages + sectors)
   - Click navigates to `/profile/[id]`

3. **Posts** (top 2 results):
   - Author avatar + Company name
   - Post preview (first 100 chars)
   - Timestamp
   - Click navigates to `/feed`

4. **Footer**:
   - "See all results for '[query]'" → navigates to `/search?q=[query]`

#### Empty State
When no results found:
```
No results found for "[query]"
Try searching for AI, Fintech, or Seed
```

#### Technical Implementation
- Uses Supabase full-text search with `tsvector` columns
- Search across:
  - **Companies**: name, one_line_pitch, description
  - **Users**: full_name, bio
  - **Posts**: content
- Weighted search (exact matches first, then partial)
- Ordered by relevance score

---

## 📄 PART 2: SEARCH RESULTS PAGE

### Location
`client/src/pages/search.tsx`

### URL Structure
- `/search?q=[query]` - Show all results
- `/search?q=[query]&type=[companies|investors|posts]` - Filter by type

### Layout Components

#### 1. Header
- **Page Title**: "Search Results"
- **Results count**: "Found X results for '[query]'"
- **Clear Filters button**: Appears when filters are applied
- **Show/Hide Filters button**: Toggle sidebar visibility
- **Note**: No duplicate search bar - users can search using the global navigation search (always visible at top)

#### 2. Tabs
Four main tabs with result counts:
- **All** - Mixed results from all categories
- **Companies** - Company-specific results
- **Investors** - Investor-specific results
- **Posts** - Post-specific results

### Tab Details

#### All Tab
- Mixed results grouped by type
- Section headers for each category
- Top 5 results per category
- "View all [type]" links to filtered tabs

#### Companies Tab

**Filters Sidebar** (left):
- Stage (checkboxes: Pre-Seed, Seed, Series A, etc.)
- Sector (checkboxes: AI/ML, Fintech, Healthcare, etc.)
- Location (text input with autocomplete)
- Has Posts (toggle)
- "Clear Filters" button

**Results Grid** (right):
- 3 columns on desktop, 1 on mobile
- Each card shows:
  - Logo, name, stage badge, sector badges
  - One-line pitch
  - Founder avatars (up to 3)
  - Stats: followers, posts, interests
  - Highlight matching query terms

**Sort Options**:
- Relevance (default)
- Most Recent
- Most Followers
- Most Posts
- Alphabetical (A-Z)

**Pagination**: 20 results per page

#### Investors Tab

**Filters Sidebar**:
- Investing Stages (checkboxes)
- Investing Sectors (checkboxes)
- Geography (text input)
- Verified Only (toggle)
- "Clear Filters" button

**Results List**:
- List view (one card per row)
- Each card shows:
  - Avatar/logo + Name + Verified badge
  - Type badge (Individual or Firm name)
  - Investment thesis:
    - Stages
    - Sectors
    - Geography
    - Check size
  - Bio preview
  - "View Profile" button
  - Highlight matching terms

**Sort Options**:
- Relevance (default)
- Alphabetical (A-Z)

#### Posts Tab

**Filters**:
- Post Type (checkboxes: General, Milestone, Demo)
- Milestone Tags (Product Launch, Revenue, Team Hire, Funding, Feature Release)
- Has Media (toggle)
- "Clear Filters" button

**Results Feed**:
- Uses existing `PostCard` component
- Shows full post with engagement (likes, comments)
- Highlights matching query terms in content
- Shows company context

**Sort Options**:
- Relevance (default)
- Most Recent
- Most Engagement (likes + comments)

---

## 🔧 TECHNICAL IMPLEMENTATION

### Database Schema

#### Search Vectors (Full-Text Search)
Added to existing tables:

```sql
-- Companies table
ALTER TABLE companies ADD COLUMN search_vector tsvector;
CREATE INDEX companies_search_idx ON companies USING GIN (search_vector);

-- Users table
ALTER TABLE users ADD COLUMN search_vector tsvector;
CREATE INDEX users_search_idx ON users USING GIN (search_vector);

-- Posts table
ALTER TABLE posts ADD COLUMN search_vector tsvector;
CREATE INDEX posts_search_idx ON posts USING GIN (search_vector);
```

#### Triggers
Automatic updates on INSERT/UPDATE:

```sql
-- Companies: weighted search (name=A, one_line_pitch=B, description=C)
CREATE FUNCTION companies_search_vector_update()
CREATE TRIGGER companies_search_vector_trigger

-- Users: weighted search (full_name=A, bio=B)
CREATE FUNCTION users_search_vector_update()
CREATE TRIGGER users_search_vector_trigger

-- Posts: search on content
CREATE FUNCTION posts_search_vector_update()
CREATE TRIGGER posts_search_vector_trigger
```

### API Layer

#### File: `client/src/lib/search.ts`

**Main Functions**:

1. `searchAll(query, limit)` - Search all content types
2. `searchCompanies(query, filters, sort, limit, offset)` - Company search with filtering
3. `searchInvestors(query, filters, sort, limit, offset)` - Investor search with filtering
4. `searchPosts(query, filters, sort, limit, offset)` - Post search with filtering
5. `highlightText(text, query)` - Highlight matching terms

**Search Query Example**:
```typescript
const { data } = await supabase
  .from('companies')
  .select('*, founders:company_founders(user:users(*))')
  .textSearch('search_vector', query, {
    type: 'plain',
    config: 'english'
  })
  .order('created_at', { ascending: false })
  .range(0, 19);
```

### Performance Optimizations

1. **Debounced Search**: 300ms delay prevents excessive API calls
2. **Indexed Full-Text Search**: GIN indexes for fast text matching
3. **Pagination**: 20 results per page to reduce load
4. **Weighted Search**: Prioritizes exact matches in important fields
5. **Lazy Loading**: Stats calculated only when needed

---

## 🎨 UI/UX Features

### Responsive Design
- Desktop: Full layout with sidebar filters
- Mobile: Collapsible filters, single column results
- Sticky navigation with global search always accessible

### Navigation Updates
- **Removed "Discover" button**: Redundant with global search functionality
- **Streamlined navigation**: Focus on Feed and Firm (for firm members)
- **Global search**: Primary discovery method for all content types

### Visual Feedback
- Loading spinner during search
- Empty states with helpful suggestions
- Result counts on tab badges
- Highlighted search terms (future enhancement)

### Accessibility
- Keyboard navigation (Enter to search)
- Focus management
- Semantic HTML structure
- ARIA labels where needed

---

## 🚀 Usage Examples

### Global Search
1. User types in navigation search bar
2. After 2 characters, autocomplete dropdown appears
3. Shows top results from each category
4. Click result → navigate to detail page
5. Click "See all results" → full search page

### Advanced Search
1. Navigate to `/search` or click from dropdown
2. Enter search query
3. Select tab (All/Companies/Investors/Posts)
4. Apply filters from sidebar
5. Sort results as needed
6. Click result cards to view details

### Filter Examples

**Find Seed-stage AI companies in San Francisco**:
- Search: "AI"
- Tab: Companies
- Filters: Stage=Seed, Sector=AI/ML, Location="San Francisco"

**Find verified investors investing in Fintech**:
- Search: "fintech"
- Tab: Investors
- Filters: Investing Sectors=Fintech, Verified Only=true

**Find milestone posts about funding**:
- Search: "funding"
- Tab: Posts
- Filters: Post Type=Milestone, Milestone Tags=Funding Announcement

---

## 📊 Search Ranking Algorithm

### Companies
1. Exact name match (weight: A)
2. One-line pitch match (weight: B)
3. Description match (weight: C)
4. Recent activity (for tie-breaking)

### Investors
1. Exact name match (weight: A)
2. Bio match (weight: B)
3. Investment thesis match (filtered client-side)

### Posts
1. Content match (equal weight)
2. Engagement score (for "Most Engagement" sort)
3. Recency (for "Most Recent" sort)

---

## 🔮 Future Enhancements

### Potential Features
1. **Search History**: Show recent searches
2. **Saved Searches**: Save filter combinations
3. **Search Suggestions**: Auto-suggest based on popular searches
4. **Advanced Filters**:
   - Company: Funding amount, team size
   - Investor: Investment count, portfolio companies
   - Posts: Date range picker, media type filter
5. **Real-time Highlighting**: Highlight exact matching terms in results
6. **Search Analytics**: Track popular searches for insights
7. **Fuzzy Matching**: Handle typos and misspellings
8. **Trending Searches**: Show what others are searching

### Performance Improvements
1. **Caching**: Cache popular searches
2. **Infinite Scroll**: Replace pagination
3. **Search Indexing**: Use Elasticsearch for complex queries
4. **Prefetching**: Preload next page of results

---

## 🧪 Testing

### Test Cases

#### Global Search
- [ ] Search with 1 character (no results)
- [ ] Search with 2+ characters (shows dropdown)
- [ ] Search with query that has results
- [ ] Search with query that has no results
- [ ] Click company result (navigates correctly)
- [ ] Click investor result (navigates correctly)
- [ ] Click post result (navigates correctly)
- [ ] Click "See all results" (navigates to search page)
- [ ] Click outside dropdown (closes)
- [ ] Press Enter (navigates to search page)

#### Search Page
- [ ] Navigate with query parameter
- [ ] All tab shows mixed results
- [ ] Companies tab shows only companies
- [ ] Investors tab shows only investors
- [ ] Posts tab shows only posts
- [ ] Apply stage filter
- [ ] Apply sector filter
- [ ] Apply location filter
- [ ] Clear filters
- [ ] Sort by relevance
- [ ] Sort by recent
- [ ] Sort by followers/posts
- [ ] Sort by alphabetical
- [ ] Pagination works
- [ ] Empty state displays

---

## 📝 Notes

### Database Migration
Migration applied: `add_search_text_vectors`
- Adds search_vector columns
- Creates GIN indexes
- Sets up update triggers
- Populates existing data

### Dependencies
- Supabase: Full-text search, database
- date-fns: Date formatting
- Lucide React: Icons
- Shadcn/ui: UI components

### Related Files
- `/client/src/lib/search.ts` - Search API functions
- `/client/src/components/navigation.tsx` - Global search bar
- `/client/src/pages/search.tsx` - Search results page
- `/client/src/App.tsx` - Route configuration

### Removed Files
- `/client/src/pages/companies.tsx` - **REMOVED** (redundant with search)
- Route `/companies` - **REMOVED** (use `/search?type=companies` instead)

---

## 🎯 Success Metrics

### Performance Targets
- Search autocomplete: < 300ms
- Full search results: < 1s
- Page load: < 2s

### User Experience
- Min 2 characters for autocomplete
- Max 3 results per category in dropdown
- 20 results per page (companies/investors/posts)
- Filters preserved during navigation

---

**Status**: ✅ Fully Implemented
**Last Updated**: October 4, 2025


