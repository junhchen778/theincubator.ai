# Entity Extraction - Quick Start

## What Was Implemented

✅ **TypeScript Types** - Added `PostMetadata` interface to `client/src/lib/types.ts`  
✅ **Edge Function** - Created extraction service at `supabase/functions/extract-entities/index.ts`  
✅ **Deployment Guide** - Complete setup instructions in `ENTITY_EXTRACTION_SETUP.md`

## What It Does

When a user creates a post, this feature automatically extracts business metrics:
- 💰 Revenue (MRR/ARR)
- 👥 User count
- 📈 Growth percentage
- 🚀 Product milestones
- 👨‍💼 Team size
- 💵 Funding

The extracted data is saved to the `posts.metadata` field asynchronously without blocking post creation.

## Deployment Steps (3 commands)

From your local machine with Supabase CLI installed:

```bash
# 1. Set OpenAI API key
supabase secrets set OPENAI_API_KEY=your-key-here

# 2. Deploy the function
supabase functions deploy extract-entities --no-verify-jwt

# 3. Configure webhook in Supabase Dashboard
# See ENTITY_EXTRACTION_SETUP.md for detailed instructions
```

## Test Example

Create a post with this content:
```
"Just hit $50k MRR! 🎉 Crossed 10,000 users and grew 200% MoM. Team is now 15 people!"
```

The metadata will be automatically populated:
```json
{
  "revenue": { "amount": 50000, "type": "MRR", "currency": "USD" },
  "users": 10000,
  "growth_percentage": 200,
  "team_size": 15,
  "extracted_at": "2025-10-06T10:30:00Z"
}
```

## Files Created/Modified

### New Files
- ✅ `supabase/functions/extract-entities/index.ts` - Edge Function
- ✅ `ENTITY_EXTRACTION_SETUP.md` - Deployment guide
- ✅ `QUICK_START.md` - This file

### Modified Files
- ✅ `client/src/lib/types.ts` - Added `PostMetadata` interface

## Next Steps

1. **Deploy**: Follow `ENTITY_EXTRACTION_SETUP.md` to deploy the Edge Function
2. **Test**: Create posts with metrics and verify extraction works
3. **Monitor**: Use `supabase functions logs extract-entities` to view activity
4. **Build UI**: Display extracted metrics as badges on post cards (future enhancement)

## Support

For detailed deployment instructions, troubleshooting, and testing, see:
📖 **[ENTITY_EXTRACTION_SETUP.md](./ENTITY_EXTRACTION_SETUP.md)**
