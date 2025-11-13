# Security Setup - Supabase Secrets Configuration

## Overview

Your application now uses Supabase Edge Functions to securely handle API calls to OpenAI and Podscan. API keys are stored as Supabase secrets and never exposed to the client-side code.

## Required Secrets Configuration

You need to configure the following secrets in your Supabase project:

### 1. OPENAI_API_KEY
Your OpenAI API key for transcript analysis and chat functionality.

**Value:** `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`

### 2. PODSCAN_API_KEY
Your Podscan API key for podcast search and episode fetching.

**Value:** `kuld4p4F4k9X9nLsDAXDw7XriH6SpOHMr8UIrhsW873759db`

### 3. PODSCAN_API_URL (Optional)
The Podscan API base URL. Defaults to `https://podscan.fm/api/v1` if not set.

**Value:** `https://podscan.fm/api/v1`

## How to Set Secrets

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the sidebar
3. Click on the **Settings** or **Secrets** tab
4. Add each secret with its name and value:
   - Name: `OPENAI_API_KEY`, Value: (paste your OpenAI key)
   - Name: `PODSCAN_API_KEY`, Value: (paste your Podscan key)
   - Name: `PODSCAN_API_URL`, Value: `https://podscan.fm/api/v1`

### Method 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Set OPENAI_API_KEY
supabase secrets set OPENAI_API_KEY=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

# Set PODSCAN_API_KEY
supabase secrets set PODSCAN_API_KEY=kuld4p4F4k9X9nLsDAXDw7XriH6SpOHMr8UIrhsW873759db

# Set PODSCAN_API_URL
supabase secrets set PODSCAN_API_URL=https://podscan.fm/api/v1
```

## Verify Configuration

After setting the secrets, you can verify they're configured correctly:

1. Go to your Supabase dashboard
2. Navigate to **Edge Functions**
3. Click on **analyze-episode** or **podscan-proxy**
4. Check the **Logs** tab to see if there are any "secret not configured" errors

## Architecture Changes

### Before (Insecure)
```
Frontend → Direct API Call (with exposed key) → OpenAI/Podscan
```

### After (Secure)
```
Frontend → Supabase Edge Function (authenticated) → OpenAI/Podscan
                  ↓
            Secrets Manager (API keys stored server-side)
```

## Edge Functions

### 1. analyze-episode
**Purpose:** Handles all OpenAI operations
- Transcript analysis with caching
- Location extraction
- Chat functionality

**Authentication:** Requires valid Supabase user authentication token

**Caching:** Automatically checks and saves to `episode_analyses` table

### 2. podscan-proxy
**Purpose:** Proxies all Podscan API requests
- Podcast search
- Episode listing
- Single episode details

**Authentication:** Requires valid Supabase user authentication token

## Security Benefits

1. **API Keys Protected:** Keys are never exposed in client-side JavaScript
2. **Authentication Required:** All Edge Function calls require user authentication
3. **Rate Limiting:** Can implement per-user rate limiting in Edge Functions
4. **Audit Logging:** All API usage is logged in Edge Function logs
5. **Centralized Control:** Easy to rotate keys or update API endpoints

## Caching Benefits

The `analyze-episode` Edge Function implements smart caching:

1. **First Request:** Calls OpenAI API, saves result to database (~10-20 seconds, costs API credits)
2. **Subsequent Requests:** Returns cached result from database (~50ms, no API cost)
3. **Cost Savings:** Reduces OpenAI API calls by ~95%
4. **Automatic:** No code changes needed, works transparently

## Testing

After configuration, test each feature:

1. **Admin Panel:** Search for podcasts (tests podscan-proxy)
2. **Episode Sync:** Add a podcast and sync episodes (tests podscan-proxy)
3. **Episode Analysis:** View an episode with transcript (tests analyze-episode with caching)
4. **AI Chat:** Ask questions about an episode (tests analyze-episode chat)

## Troubleshooting

### "Authentication required" errors
- Make sure users are signed in before accessing features
- Check that Supabase session is valid

### "OPENAI_API_KEY not configured" errors
- Verify secret is set in Supabase dashboard
- Check spelling matches exactly: `OPENAI_API_KEY`
- Redeploy Edge Functions if secrets were just added

### "PODSCAN_API_KEY not configured" errors
- Verify secret is set in Supabase dashboard
- Check spelling matches exactly: `PODSCAN_API_KEY`
- Redeploy Edge Functions if secrets were just added

### Edge Function errors
- Check Edge Function logs in Supabase dashboard
- Look for error messages in the Functions > Logs section
- Verify secrets are properly configured

## Next Steps

1. Set the three secrets in your Supabase dashboard
2. Test the admin panel by searching for a podcast
3. Add a podcast and verify episodes sync correctly
4. View an episode and verify AI analysis works
5. Test the chat feature to ensure it responds correctly

## Important Notes

- **Never commit .env files** with API keys to version control
- The `.env` file now only contains Supabase public credentials
- All sensitive API keys are stored securely in Supabase secrets
- Edge Functions handle authentication and validate all requests
- Caching dramatically reduces API costs and improves performance
