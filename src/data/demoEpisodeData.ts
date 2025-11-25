import type { TranscriptAnalysis } from '../services/openaiService';
import type { GeocodedLocation } from '../services/geocodingService';

export const demoPodcast = {
  id: 'demo-podcast',
  podcast_id: 'demo-podcast',
  slug: 'demo',
  name: 'Augmented Pods',
  description: 'Interactive episode pages for your podcast',
  image_url: 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=800',
  publisher_name: 'Augmented Pods',
  status: 'active' as const,
  is_paused: false,
  last_synced_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoEpisode = {
  id: 'demo-episode',
  podcast_id: 'demo-podcast',
  episode_id: 'demo-episode',
  episode_guid: 'demo-episode-guid',
  title: 'Explore the Features',
  slug: 'features-demo',
  description: 'Click through the tabs above to discover how Augmented Pods transforms your podcast episodes into beautiful, interactive experiences. Every feature you see here is automatically generated from your transcript.',
  audio_url: null,
  image_url: 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=800',
  duration: 2734,
  word_count: 7842,
  transcript: 'Sample transcript content for demonstration purposes.',
  transcript_word_timestamps: null,
  published_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  synced_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoLocations: GeocodedLocation[] = [
  {
    name: "Automatic Location Extraction",
    lat: 40.7128,
    lon: -74.0060,
    context: "AI identifies every location mentioned in your transcript automatically - no manual tagging required",
    quotes: [
      "Perfect for travel podcasts, true crime, history shows, and any content featuring real places",
      "Works with cities, countries, landmarks, and even specific addresses"
    ]
  },
  {
    name: "Beautiful Satellite Imagery",
    lat: 51.5074,
    lon: -0.1278,
    context: "Each location is displayed with high-quality satellite views that help listeners visualize the places you discuss",
    quotes: [
      "Satellite imagery gives context and depth to your storytelling",
      "Listeners can zoom and explore each location interactively"
    ]
  },
  {
    name: "Interactive Markers",
    lat: 48.8566,
    lon: 2.3522,
    context: "Numbered pins show the order locations appear in your episode - click any marker to see details",
    quotes: [
      "Each marker includes context and relevant quotes from your transcript",
      "Easy navigation between all locations mentioned"
    ]
  },
  {
    name: "Context & Quotes",
    lat: 35.6762,
    lon: 139.6503,
    context: "Every location includes the context of why it was mentioned and exact quotes from your episode",
    quotes: [
      "Helps listeners remember what was said about each place",
      "Creates a visual reference guide for your episode"
    ]
  },
  {
    name: "Side Panel Navigation",
    lat: -33.8688,
    lon: 151.2093,
    context: "A scrollable list shows all locations, making it easy to jump between places",
    quotes: [
      "Click any location in the list to center the map",
      "Great for episodes with multiple locations"
    ]
  },
  {
    name: "Unlimited Locations",
    lat: 37.7749,
    lon: -122.4194,
    context: "Whether you mention 3 locations or 30, they all get mapped automatically with no extra effort",
    quotes: [
      "No limits on how many places can be featured",
      "Each one is properly geocoded and displayed beautifully"
    ]
  }
];

export const demoAnalysis: TranscriptAnalysis = {
  summary: "This is where AI-generated episode summaries appear. After analyzing your transcript, we create a concise 2-3 paragraph overview that captures the key themes and topics discussed.\n\nThe summary helps new listeners quickly understand what your episode is about before committing to listen. It's perfect for sharing on social media or embedding in show notes.\n\nEverything is generated automatically from your transcript - no writing required from you. Just publish your episode and the summary appears here instantly.",

  keyPersonnel: [
    {
      name: "Automatic Person Detection",
      role: "AI Feature",
      description: "Our AI automatically identifies every person mentioned in your episode and creates detailed cards for each one. Perfect for interview shows, history podcasts, and true crime.",
      quotes: [
        "Helps listeners keep track of who's who in complex stories",
        "Each person gets a card with their role, description, and relevant quotes"
      ]
    },
    {
      name: "Role & Context",
      role: "Information Display",
      description: "Each person card includes their role, a description of their significance, and why they matter to your episode's story.",
      quotes: [
        "Listeners see the full context of each person's involvement",
        "Great for educational content and storytelling podcasts"
      ]
    },
    {
      name: "Relevant Quotes",
      role: "Content Feature",
      description: "We automatically extract the most relevant quotes about or from each person mentioned in your episode.",
      quotes: [
        "Shows exactly what was said about or by this person",
        "Helps listeners recall specific moments"
      ]
    },
    {
      name: "Character Tracking",
      role: "Listener Aid",
      description: "For narrative podcasts with multiple characters, this feature serves as a quick reference guide listeners can consult anytime.",
      quotes: [
        "Reduces listener confusion in complex stories",
        "Acts as a visual companion to your audio narrative"
      ]
    }
  ],

  timeline: [
    {
      date: "Feature 1",
      event: "Chronological Event Extraction",
      description: "Our AI identifies dates, time periods, and chronological events from your transcript and arranges them in order. Perfect for history podcasts, documentary-style shows, and any narrative with a timeline.",
      quote: "Events are automatically sorted by date with full context"
    },
    {
      date: "Feature 2",
      event: "Visual Timeline Display",
      description: "Events appear as expandable cards in a beautiful vertical timeline layout. Each event includes the date, description, and relevant quotes from your episode.",
      quote: "Makes complex chronologies easy to understand visually"
    },
    {
      date: "Feature 3",
      event: "Flexible Date Formats",
      description: "Works with any date format - specific dates (July 4, 1776), date ranges (1939-1945), or even relative time (three years later). Our AI understands it all.",
      quote: "Handles everything from ancient history to recent events"
    },
    {
      date: "Feature 4",
      event: "Expandable Details",
      description: "Each timeline event can be expanded to show more information. Listeners click to dive deeper into moments that interest them.",
      quote: "Progressive disclosure keeps the interface clean but informative"
    },
    {
      date: "Feature 5",
      event: "Context & Quotes",
      description: "Every event includes contextual information and exact quotes from your transcript, helping listeners connect the timeline to your narration.",
      quote: "Creates a perfect companion reference for history content"
    }
  ],

  locations: demoLocations.map(loc => ({
    name: loc.name,
    context: loc.context,
    quotes: loc.quotes
  })),

  keyMoments: [
    {
      title: "Automatic Highlight Detection",
      topic: "Content Discovery",
      description: "AI analyzes your transcript to identify the most important moments, key insights, and memorable quotes. These highlights help listeners discover and remember your best content.",
      quote: "Perfect for episodes with multiple topics or long-form content",
      timestamp: "Feature"
    },
    {
      title: "Topic Categorization",
      topic: "Organization",
      description: "Each moment is categorized by topic, making it easy for listeners to find and navigate to specific subjects discussed in your episode.",
      quote: "Helps listeners jump to the parts that interest them most",
      timestamp: "Feature"
    },
    {
      title: "Searchable Content",
      topic: "Accessibility",
      description: "Key moments create a searchable index of your episode's content. Listeners can quickly find that one quote or insight they remember hearing.",
      quote: "Makes your content more discoverable and useful long-term",
      timestamp: "Feature"
    },
    {
      title: "Share-Worthy Quotes",
      topic: "Marketing",
      description: "Each moment includes quotable text that's perfect for social media sharing. Turn your episode's best moments into marketing content automatically.",
      quote: "Built-in social media content from every episode",
      timestamp: "Feature"
    },
    {
      title: "Engagement Boost",
      topic: "Listener Experience",
      description: "By highlighting key moments, you give listeners more ways to engage with your content beyond just listening. They can explore, reference, and share.",
      quote: "Transforms passive listening into active engagement",
      timestamp: "Feature"
    }
  ],

  references: [
    {
      type: "book",
      title: "Automatic Reference Detection",
      author: "Books",
      context: "AI identifies every book mentioned in your episode and creates a categorized reference list with context",
      quote: "Perfect for book club podcasts, educational shows, and interview episodes"
    },
    {
      type: "film",
      title: "Media & Entertainment",
      author: "Films & Shows",
      context: "Movies, TV shows, documentaries - all automatically detected and listed with context about why they were mentioned",
      quote: "Great for pop culture podcasts and film review shows"
    },
    {
      type: "article",
      title: "Articles & Research",
      author: "Publications",
      context: "Academic papers, news articles, blog posts - we track all written sources mentioned in your episode",
      quote: "Essential for journalism podcasts and research-based content"
    },
    {
      type: "company",
      title: "Companies & Organizations",
      author: "Business",
      context: "Brands, companies, non-profits, and organizations are automatically identified and referenced",
      quote: "Useful for business podcasts and industry-specific shows"
    },
    {
      type: "book",
      title: "Context & Quotes",
      author: "Details",
      context: "Each reference includes context explaining why it was mentioned and relevant quotes from your transcript",
      quote: "Helps listeners remember the connection to your episode"
    },
    {
      type: "article",
      title: "Categorized Organization",
      author: "Structure",
      context: "References are automatically organized by type with icons and color coding for easy navigation",
      quote: "Makes it simple for listeners to find what they're looking for"
    }
  ]
};

export const demoSettings = {
  id: 'demo-settings',
  podcast_id: 'demo-podcast',
  primary_color: '#0891b2',
  secondary_color: '#06b6d4',
  logo_url: null,
  custom_header_text: null,
  analytics_code: null,
  visible_tabs: ['map', 'timeline', 'people', 'moments', 'references', 'overview', 'transcript', 'notes'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
