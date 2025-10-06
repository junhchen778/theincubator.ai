# Setting Up Environment Variables for AI Summaries

## The Error You're Seeing

The error "Unexpected token '<', '<!DOCTYPE'..." means the server is returning an error page (HTML) instead of JSON because the **environment variables are not configured yet**.

## Quick Fix - Add Environment Variables in Replit

Since you're on Replit, follow these steps:

### 1. Click on "Secrets" (🔒 icon in the left sidebar)

### 2. Add these secrets:

#### OPENAI_API_KEY
```
sk-proj-your-actual-key-here
```
**Get it from:** https://platform.openai.com/api-keys
- Sign in to OpenAI
- Click "Create new secret key"
- Copy the key (starts with `sk-proj-...`)

#### SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```
**Get it from:** Your Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/xmvhinisflafruvzznqq/settings/api
2. Look for "Project API keys" section
3. Copy the **`service_role`** key (NOT the anon key!)
   - ⚠️ **Important:** This key is secret and should never be exposed to the client

### 3. Restart the Server

After adding both secrets:
1. Stop the current server (Ctrl+C in the console)
2. Click "Run" button again
3. Or run: `npm run dev`

### 4. Test It

Now when you click "Generate Summary", it should work! You should see console output like:
```
✅ OpenAI API configured
✅ Supabase admin configured
Generating summary for company...
```

---

## Verification

To verify the environment variables are loaded correctly:

```bash
# In the Replit shell, run:
echo $OPENAI_API_KEY | cut -c1-10
echo $SUPABASE_SERVICE_ROLE_KEY | cut -c1-10
```

Both should show the first 10 characters of your keys.

---

## Alternative: Using .env file (Local Development)

If you're running locally (not on Replit):

1. Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```

2. Add these lines:
   ```env
   VITE_SUPABASE_URL=https://xmvhinisflafruvzznqq.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdmhpbmlzZmxhZnJ1dnp6bnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTI1MjAsImV4cCI6MjA3NDc4ODUyMH0.tcNQxcHwGmD6BxjpRHekhoicp6gjmPFfWPqum_GGOiA
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   OPENAI_API_KEY=your-openai-key-here
   ```

3. Install dotenv if needed:
   ```bash
   npm install dotenv
   ```

4. Update `server/index.ts` to load .env:
   ```typescript
   import 'dotenv/config';
   ```

---

## Troubleshooting

### Still getting the error after adding secrets?
- Make sure you **restarted the server** after adding secrets
- Verify both keys are added correctly (no extra spaces)
- Check the Replit console for warning messages

### "Missing OpenAI API key" warning in console?
- The OPENAI_API_KEY secret is not set or is incorrect
- Check it starts with `sk-proj-` or `sk-`

### "Missing Supabase configuration" warning in console?
- The SUPABASE_SERVICE_ROLE_KEY secret is not set
- Make sure you copied the SERVICE_ROLE key, not the ANON key

### OpenAI API errors?
- Check your OpenAI account has credits: https://platform.openai.com/usage
- Verify your API key is valid
- You may need to add billing information to your OpenAI account

---

## Security Notes

⚠️ **IMPORTANT:**
- **Never commit** `.env` files to git
- **Never expose** the service role key to the client
- The service role key **bypasses RLS** - handle with care
- Keep your OpenAI API key secret

The implementation already handles this correctly - these keys are only used server-side.
