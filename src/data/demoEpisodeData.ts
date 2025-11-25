import type { TranscriptAnalysis } from '../services/openaiService';
import type { GeocodedLocation } from '../services/geocodingService';

export const demoPodcast = {
  id: 'demo-podcast',
  podcast_id: 'demo-podcast',
  slug: 'demo',
  name: 'The Silk Road Chronicles',
  description: 'Journey through history along the ancient trade routes that connected East and West',
  image_url: 'https://images.pexels.com/photos/3779816/pexels-photo-3779816.jpeg?auto=compress&cs=tinysrgb&w=800',
  publisher_name: 'Historical Explorations Network',
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
  title: 'The Golden Age of the Silk Road: Trade, Culture, and Discovery',
  slug: 'golden-age-silk-road',
  description: 'Explore the fascinating network of trade routes that connected civilizations across Asia, the Middle East, and Europe for over 1,500 years. This episode examines the merchants, explorers, and goods that traveled these routes, and the profound cultural exchange that shaped our modern world.',
  audio_url: null,
  image_url: 'https://images.pexels.com/photos/3779816/pexels-photo-3779816.jpeg?auto=compress&cs=tinysrgb&w=800',
  duration: 2734,
  word_count: 7842,
  transcript: `The Silk Road wasn't a single road at all, but rather a vast network of trade routes connecting the East and West for over fifteen hundred years. At its peak during the Tang Dynasty, around 700 CE, these routes stretched nearly 7,000 miles from Chang'an in China to the Mediterranean Sea.

Our journey begins in Xi'an, once known as Chang'an, the eastern terminus of the Silk Road. In the 8th century, this was the largest city in the world, home to over a million people. The markets here bustled with merchants from every corner of the known world. Chinese silk, the most coveted luxury item of the ancient world, began its journey here.

The caravans that left Xi'an faced an arduous journey across the Taklamakan Desert, one of the world's largest and most unforgiving deserts. The name itself means "go in and you won't come out." Yet merchants braved these dangers for the promise of profit. They traveled in large groups for protection, following ancient paths marked by the bones of less fortunate travelers.

Reaching Kashgar after weeks in the desert must have felt like reaching paradise. This oasis city at the western edge of the Taklamakan was a crucial junction where the northern and southern routes around the desert met. Here, merchants from China met those from Central Asia and Persia. The city's bazaars were legendary, featuring goods from three continents.

From Kashgar, the routes continued west to Samarkand, perhaps the most famous city along the entire Silk Road. Under Sogdian control in the 6th and 7th centuries, Samarkand became incredibly wealthy. The Sogdian merchants were the true masters of Silk Road trade, acting as middlemen between East and West. Their language became the lingua franca of trade across Central Asia.

The journey continued through Persia to Baghdad, the Abbasid capital that became one of the world's great centers of learning. The Silk Road brought more than just goods - it carried ideas, religions, and technologies. Buddhist monks traveled east to west, while Islamic scholars moved eastward. Paper-making technology, one of China's greatest inventions, reached the Islamic world here in Baghdad after the Battle of Talas in 751 CE.

From Baghdad, routes split toward Constantinople, the great Byzantine capital, and south to Damascus. These cities marked the western end of the overland routes, where goods would be transferred to Mediterranean ships. The Byzantine Empire grew wealthy controlling this final leg of the journey.

The Silk Road facilitated one of history's greatest cultural exchanges. Chinese silk and porcelain flowed west, while gold, silver, and precious stones moved east. But perhaps more important than trade goods was the exchange of ideas, technologies, and religions that shaped both Eastern and Western civilizations.

The most famous Western traveler on the Silk Road was Marco Polo, who journeyed from Venice to China in the late 13th century. His accounts of the magnificent court of Kublai Khan amazed European readers and inspired centuries of exploration. Though some historians debate the accuracy of his accounts, his book remains one of the most influential travel narratives ever written.

Earlier, in the 14th century, Ibn Battuta, the great Moroccan explorer, traveled extensively along these routes. His journeys covered over 75,000 miles, more than any explorer before the age of steam power. His detailed observations provide invaluable insights into the cultures and cities of the medieval Silk Road.

The original Silk Road declined after the Mongol Empire's fall and the rise of maritime trade routes in the 15th century. Yet its legacy continues today. Modern infrastructure projects like China's Belt and Road Initiative explicitly reference this historical network, attempting to recreate economic and cultural connections across Eurasia.

The Silk Road's story reminds us that globalization isn't new. For over a millennium, these routes connected distant civilizations, fostering trade, cultural exchange, and human progress. The technologies, religions, and ideas that traveled these paths continue to shape our world today.`,
  transcript_word_timestamps: null,
  published_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  synced_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoLocations: GeocodedLocation[] = [
  {
    name: "Xi'an (Chang'an), China",
    lat: 34.3416,
    lon: 108.9398,
    context: "Eastern terminus of the Silk Road, once the world's largest city",
    quotes: [
      "In the 8th century, this was the largest city in the world, home to over a million people",
      "Chinese silk, the most coveted luxury item of the ancient world, began its journey here"
    ]
  },
  {
    name: "Kashgar, China",
    lat: 39.4704,
    lon: 75.9896,
    context: "Crucial oasis city at the western edge of the Taklamakan Desert",
    quotes: [
      "This oasis city at the western edge of the Taklamakan was a crucial junction where the northern and southern routes around the desert met",
      "The city's bazaars were legendary, featuring goods from three continents"
    ]
  },
  {
    name: "Samarkand, Uzbekistan",
    lat: 39.6270,
    lon: 66.9750,
    context: "Most famous city along the Silk Road, center of Sogdian trade",
    quotes: [
      "Perhaps the most famous city along the entire Silk Road",
      "Under Sogdian control in the 6th and 7th centuries, Samarkand became incredibly wealthy"
    ]
  },
  {
    name: "Baghdad, Iraq",
    lat: 33.3152,
    lon: 44.3661,
    context: "Abbasid capital and center of learning where East met West",
    quotes: [
      "The Abbasid capital that became one of the world's great centers of learning",
      "Paper-making technology, one of China's greatest inventions, reached the Islamic world here in Baghdad after the Battle of Talas in 751 CE"
    ]
  },
  {
    name: "Damascus, Syria",
    lat: 33.5138,
    lon: 36.2765,
    context: "Western terminus where goods transferred to Mediterranean ships",
    quotes: [
      "These cities marked the western end of the overland routes, where goods would be transferred to Mediterranean ships"
    ]
  },
  {
    name: "Constantinople (Istanbul), Turkey",
    lat: 41.0082,
    lon: 28.9784,
    context: "Byzantine capital controlling the western end of the Silk Road",
    quotes: [
      "The Byzantine Empire grew wealthy controlling this final leg of the journey"
    ]
  },
  {
    name: "Venice, Italy",
    lat: 45.4408,
    lon: 12.3155,
    context: "Starting point of Marco Polo's legendary journey",
    quotes: [
      "Marco Polo, who journeyed from Venice to China in the late 13th century"
    ]
  },
  {
    name: "Dunhuang, China",
    lat: 40.1424,
    lon: 94.6624,
    context: "Important Buddhist site and gateway to the desert",
    quotes: [
      "Buddhist monks traveled east to west, while Islamic scholars moved eastward"
    ]
  }
];

export const demoAnalysis: TranscriptAnalysis = {
  summary: "This episode explores the Silk Road, the ancient network of trade routes that connected East and West for over 1,500 years. Beginning in Xi'an, China, and stretching to the Mediterranean, these routes facilitated not just the exchange of luxury goods like silk, but also the profound transfer of ideas, technologies, and religions that shaped world history.\n\nThe episode traces the journey of merchants through treacherous deserts and across vast distances, visiting key cities like Kashgar, Samarkand, Baghdad, and Constantinople. Each city played a unique role in the trade network, with Sogdian merchants emerging as master traders who bridged Eastern and Western civilizations.\n\nBeyond commerce, the Silk Road enabled one of history's greatest cultural exchanges. Technologies like paper-making traveled west, while religions including Buddhism and Islam spread along the routes. Famous explorers like Marco Polo and Ibn Battuta documented their journeys, leaving accounts that continue to fascinate us today. Though the original routes declined after the 15th century, their legacy persists in modern globalization efforts.",

  keyPersonnel: [
    {
      name: "Marco Polo",
      role: "Venetian merchant and explorer",
      description: "13th-century traveler whose journey from Venice to China and detailed accounts of Kublai Khan's court inspired centuries of European exploration and trade with the East.",
      quotes: [
        "His accounts of the magnificent court of Kublai Khan amazed European readers and inspired centuries of exploration",
        "Though some historians debate the accuracy of his accounts, his book remains one of the most influential travel narratives ever written"
      ]
    },
    {
      name: "Ibn Battuta",
      role: "Moroccan explorer and scholar",
      description: "14th-century traveler who covered over 75,000 miles across the Silk Road and beyond, providing invaluable observations of medieval cultures and cities.",
      quotes: [
        "His journeys covered over 75,000 miles, more than any explorer before the age of steam power",
        "His detailed observations provide invaluable insights into the cultures and cities of the medieval Silk Road"
      ]
    },
    {
      name: "Kublai Khan",
      role: "Mongol Emperor of China",
      description: "Fifth Khagan of the Mongol Empire and founder of the Yuan Dynasty who welcomed foreign merchants and travelers, including Marco Polo, to his court.",
      quotes: [
        "His accounts of the magnificent court of Kublai Khan amazed European readers"
      ]
    },
    {
      name: "Sogdian Merchants",
      role: "Central Asian traders",
      description: "Master merchants who dominated Silk Road trade in the 6th-7th centuries, acting as crucial middlemen between Eastern and Western civilizations and establishing their language as the trade lingua franca.",
      quotes: [
        "The Sogdian merchants were the true masters of Silk Road trade, acting as middlemen between East and West",
        "Their language became the lingua franca of trade across Central Asia"
      ]
    },
    {
      name: "Chinese Silk Producers",
      role: "Artisans and manufacturers",
      description: "Skilled craftspeople in Chang'an who produced silk, the most coveted luxury item of the ancient world that gave the Silk Road its name.",
      quotes: [
        "Chinese silk, the most coveted luxury item of the ancient world, began its journey here"
      ]
    },
    {
      name: "Buddhist Monks",
      role: "Religious travelers and cultural ambassadors",
      description: "Monks who traveled the Silk Road carrying Buddhist teachings from India to East Asia, facilitating cultural and religious exchange along the routes.",
      quotes: [
        "Buddhist monks traveled east to west, while Islamic scholars moved eastward"
      ]
    }
  ],

  timeline: [
    {
      date: "138 BCE",
      event: "Zhang Qian's Diplomatic Mission",
      description: "Chinese diplomat Zhang Qian embarked on a mission to Central Asia, opening the first official connections between China and the Western regions, effectively initiating the Silk Road network.",
      quote: "These routes stretched nearly 7,000 miles from Chang'an in China to the Mediterranean Sea"
    },
    {
      date: "100-200 CE",
      event: "Peak of Roman-China Trade",
      description: "The Roman Empire and Han Dynasty China engaged in extensive trade via the Silk Road, with Roman gold flowing east for Chinese silk and spices.",
      quote: "Chinese silk and porcelain flowed west, while gold, silver, and precious stones moved east"
    },
    {
      date: "500-700 CE",
      event: "Sogdian Golden Age",
      description: "Sogdian merchants dominated Silk Road trade, with Samarkand becoming one of the wealthiest and most important trading centers, and the Sogdian language becoming the commercial lingua franca of Central Asia.",
      quote: "Under Sogdian control in the 6th and 7th centuries, Samarkand became incredibly wealthy"
    },
    {
      date: "700 CE",
      event: "Tang Dynasty Peak",
      description: "During the Tang Dynasty, the Silk Road reached its golden age. Chang'an (Xi'an) became the world's largest city with over one million inhabitants, serving as the eastern terminus of the thriving trade network.",
      quote: "At its peak during the Tang Dynasty, around 700 CE, these routes stretched nearly 7,000 miles from Chang'an in China to the Mediterranean Sea"
    },
    {
      date: "751 CE",
      event: "Battle of Talas and Paper Technology Transfer",
      description: "Following the Battle of Talas between the Abbasid Caliphate and Tang Dynasty, Chinese paper-making technology was transferred to the Islamic world, revolutionizing knowledge preservation in the West.",
      quote: "Paper-making technology, one of China's greatest inventions, reached the Islamic world here in Baghdad after the Battle of Talas in 751 CE"
    },
    {
      date: "1271-1295 CE",
      event: "Marco Polo's Journey",
      description: "Venetian merchant Marco Polo traveled from Venice to China, spending years at Kublai Khan's court. His subsequent book about the journey amazed European readers and inspired future exploration.",
      quote: "Marco Polo, who journeyed from Venice to China in the late 13th century. His accounts of the magnificent court of Kublai Khan amazed European readers"
    },
    {
      date: "1325-1354 CE",
      event: "Ibn Battuta's Travels",
      description: "Moroccan scholar Ibn Battuta undertook extensive travels across the Silk Road network, covering over 75,000 miles and documenting the cultures, cities, and customs of the medieval world.",
      quote: "His journeys covered over 75,000 miles, more than any explorer before the age of steam power"
    }
  ],

  locations: demoLocations.map(loc => ({
    name: loc.name,
    context: loc.context,
    quotes: loc.quotes
  })),

  keyMoments: [
    {
      title: "The Eastern Terminus: Chang'an",
      topic: "Origins of the Silk Road",
      description: "Xi'an, once called Chang'an, served as the eastern starting point of the Silk Road. As the world's largest city in the 8th century with over a million inhabitants, it was where Chinese silk began its legendary journey westward.",
      quote: "In the 8th century, this was the largest city in the world, home to over a million people",
      timestamp: "02:15"
    },
    {
      title: "Crossing the Desert of Death",
      topic: "Perils of Trade",
      description: "Merchants faced the treacherous Taklamakan Desert, whose name literally means 'go in and you won't come out.' Despite the dangers, the promise of profit drove caravans across this unforgiving landscape.",
      quote: "The name itself means 'go in and you won't come out.' Yet merchants braved these dangers for the promise of profit",
      timestamp: "05:42"
    },
    {
      title: "Samarkand: The Jewel of the Silk Road",
      topic: "Trading Centers",
      description: "Under Sogdian control, Samarkand became perhaps the most famous and wealthy city along the entire Silk Road, with its merchants serving as master middlemen between East and West.",
      quote: "Perhaps the most famous city along the entire Silk Road. Under Sogdian control in the 6th and 7th centuries, Samarkand became incredibly wealthy",
      timestamp: "12:28"
    },
    {
      title: "Technology Transfer: The Gift of Paper",
      topic: "Cultural Exchange",
      description: "After the Battle of Talas in 751 CE, Chinese paper-making technology reached the Islamic world in Baghdad, revolutionizing the preservation and spread of knowledge across civilizations.",
      quote: "Paper-making technology, one of China's greatest inventions, reached the Islamic world here in Baghdad after the Battle of Talas in 751 CE",
      timestamp: "18:55"
    },
    {
      title: "More Than Just Goods",
      topic: "Legacy and Impact",
      description: "The Silk Road facilitated history's greatest cultural exchange, carrying not just luxury items but ideas, religions, and technologies that shaped both Eastern and Western civilizations for centuries.",
      quote: "Perhaps more important than trade goods was the exchange of ideas, technologies, and religions that shaped both Eastern and Western civilizations",
      timestamp: "24:10"
    }
  ],

  references: [
    {
      type: "book",
      title: "The Silk Roads: A New History of the World",
      author: "Peter Frankopan",
      context: "Comprehensive examination of how the Silk Road routes shaped world history and continue to influence modern geopolitics",
      quote: "The Silk Road's story reminds us that globalization isn't new"
    },
    {
      type: "book",
      title: "Life Along the Silk Road",
      author: "Susan Whitfield",
      context: "Detailed account of daily life for merchants, monks, and travelers along the ancient trade routes through individual stories",
      quote: "The markets here bustled with merchants from every corner of the known world"
    },
    {
      type: "book",
      title: "The Travels of Marco Polo",
      author: "Marco Polo",
      context: "Medieval travelogue describing Polo's journey to China and time at Kublai Khan's court that inspired European exploration",
      quote: "His book remains one of the most influential travel narratives ever written"
    },
    {
      type: "film",
      title: "The Silk Road: A Documentary Series",
      context: "NHK documentary exploring the history, geography, and cultural significance of the Silk Road trade routes",
      quote: "These routes stretched nearly 7,000 miles from Chang'an in China to the Mediterranean Sea"
    },
    {
      type: "article",
      title: "The Sogdians: Masters of Silk Road Trade",
      context: "Academic article examining the role of Sogdian merchants in facilitating East-West trade and cultural exchange",
      quote: "The Sogdian merchants were the true masters of Silk Road trade"
    },
    {
      type: "article",
      title: "Paper's Journey West: The Battle of Talas",
      context: "Historical analysis of how Chinese paper-making technology transferred to the Islamic world and revolutionized knowledge preservation",
      quote: "Paper-making technology, one of China's greatest inventions, reached the Islamic world here in Baghdad"
    },
    {
      type: "company",
      title: "Belt and Road Initiative",
      context: "Modern Chinese infrastructure project explicitly referencing the historical Silk Road to recreate economic connections across Eurasia",
      quote: "Modern infrastructure projects like China's Belt and Road Initiative explicitly reference this historical network"
    },
    {
      type: "article",
      title: "Ibn Battuta: History's Greatest Traveler",
      context: "Examination of the 14th-century Moroccan explorer's extensive travels and detailed observations of medieval Silk Road cultures",
      quote: "His journeys covered over 75,000 miles, more than any explorer before the age of steam power"
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
