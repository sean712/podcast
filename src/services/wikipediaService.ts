export interface WikipediaPersonData {
  imageUrl?: string;
  pageUrl?: string;
}

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';

async function searchWikipediaPerson(name: string): Promise<string | null> {
  try {
    const searchUrl = `${WIKIPEDIA_API_BASE}?action=opensearch&search=${encodeURIComponent(name)}&limit=1&format=json&origin=*`;

    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.warn(`Wikipedia search failed for ${name}:`, response.status);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1]) || data[1].length === 0) {
      console.log(`No Wikipedia page found for: ${name}`);
      return null;
    }

    const pageTitle = data[1][0];
    console.log(`Found Wikipedia page for ${name}: ${pageTitle}`);
    return pageTitle;
  } catch (error) {
    console.error(`Error searching Wikipedia for ${name}:`, error);
    return null;
  }
}

async function getPersonImage(pageTitle: string): Promise<WikipediaPersonData | null> {
  try {
    const imageUrl = `${WIKIPEDIA_API_BASE}?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages|info&format=json&pithumbsize=300&inprop=url&origin=*`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Wikipedia image fetch failed for ${pageTitle}:`, response.status);
      return null;
    }

    const data = await response.json();

    if (!data.query || !data.query.pages) {
      return null;
    }

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (!page || pageId === '-1') {
      return null;
    }

    const result: WikipediaPersonData = {
      pageUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
    };

    if (page.thumbnail && page.thumbnail.source) {
      result.imageUrl = page.thumbnail.source;
      console.log(`Found image for ${pageTitle}: ${result.imageUrl}`);
    } else {
      console.log(`No image available for ${pageTitle}`);
    }

    return result;
  } catch (error) {
    console.error(`Error fetching Wikipedia image for ${pageTitle}:`, error);
    return null;
  }
}

export async function fetchWikipediaDataForPerson(name: string): Promise<WikipediaPersonData | null> {
  try {
    const pageTitle = await searchWikipediaPerson(name);
    if (!pageTitle) {
      return null;
    }

    const data = await getPersonImage(pageTitle);
    return data;
  } catch (error) {
    console.error(`Failed to fetch Wikipedia data for ${name}:`, error);
    return null;
  }
}

export async function fetchWikipediaDataForPeople(people: Array<{ name: string }>): Promise<Array<WikipediaPersonData | null>> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const results: Array<WikipediaPersonData | null> = [];

  for (const person of people) {
    const data = await fetchWikipediaDataForPerson(person.name);
    results.push(data);

    await delay(100);
  }

  return results;
}
