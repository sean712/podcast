/*
  # Update references structure to include URLs

  1. Changes
    - Update the references JSONB column structure to include a `urls` array for each reference
    - Each URL object contains: url, title, domain
    - This allows storing web search results for each reference

  2. Structure
    ```json
    {
      "type": "book|film|company|product|article|website|other",
      "name": "Reference name",
      "context": "Why it was mentioned",
      "quote": "Direct quote from transcript",
      "timestamp": "HH:MM:SS.mmm",
      "urls": [
        {
          "url": "https://...",
          "title": "Page title",
          "domain": "example.com"
        }
      ]
    }
    ```

  3. Notes
    - No schema change needed - JSONB is flexible
    - Existing references will simply not have the urls field
    - New analyses will include urls when web search is used
*/

-- This migration documents the structure but requires no actual schema changes
-- since JSONB columns are flexible and can accommodate the new urls field
SELECT 1;
