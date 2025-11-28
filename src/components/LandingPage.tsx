import { Radio, Sparkles, Clock, Share2, Zap, CheckCircle2, Map, Users as UsersIcon, List, StickyNote, BookOpen } from 'lucide-react';
import PodcastFooter from './PodcastFooter';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-7 h-7 text-white" />
              <span className="text-xl font-bold text-white">Augmented Pods</span>
            </div>
            <button
              onClick={onSignIn}
              className="text-slate-300 hover:text-white font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/adobe-express-hero.png"
              alt="Podcast analytics dashboard"
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/85 to-slate-900 z-10" />
          <div className="relative z-20 px-4 sm:px-6 lg:px-8 py-32 sm:py-40 lg:py-48">
            <div className="max-w-5xl mx-auto text-center">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-8 leading-tight">
                Beautiful interactive pages for every episode
              </h1>
              <p className="text-xl sm:text-2xl text-slate-200 mb-12 leading-relaxed max-w-3xl mx-auto">
                Give your listeners more than just audio. Automated, branded episode pages with smart features—no extra work required.
              </p>
              <button
                onClick={onGetStarted}
                className="bg-cyan-500 text-slate-950 px-10 py-5 rounded-lg font-semibold hover:bg-cyan-400 transition-all shadow-2xl hover:shadow-cyan-500/50 inline-flex items-center gap-3 text-xl border border-cyan-400/60 hover:scale-105"
              >
                Get This For Your Podcast
                <Sparkles className="w-6 h-6" />
              </button>
              <p className="text-sm text-slate-300 mt-6">
                Setup handled by us • Live in 48 hours
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Interactive Features
              </h2>
              <p className="text-lg text-slate-300">
                Smart tools that make each episode more engaging
              </p>
            </div>

            <div className="space-y-24">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-500">
                      <Map className="w-6 h-6 text-slate-950" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Interactive Location Map</h3>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed mb-6">
                    Every place mentioned in your episode is automatically mapped and displayed on a beautiful satellite view. Listeners can explore locations, see context, and understand the geographic story behind your content.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Automatic location extraction from transcript</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Satellite imagery with numbered markers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Context and quotes for each location</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur">
                    <img
                      src="/Screenshot 2025-11-05 at 20.41.17.png"
                      alt="Interactive map showing locations mentioned in podcast episode"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-slate-950" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Smart Timeline</h3>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed mb-6">
                    Automatically identifies the most important moments and creates a chronological timeline of events discussed in your episode. Perfect for historical content, storytelling, and narrative podcasts.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Chronological event extraction</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Expandable details for each moment</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Visual timeline with dates and context</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur">
                    <img
                      src="/Screenshot 2025-11-05 at 20.41.22.png"
                      alt="Timeline showing key moments from podcast episode"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-slate-950" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Key People</h3>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed mb-6">
                    Every person mentioned gets their own card with descriptions, roles, and relevant quotes from the episode. Helps listeners keep track of who's who in complex stories.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Automatic person identification</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Role and context descriptions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Relevant quotes and mentions</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur">
                    <img
                      src="/Screenshot 2025-11-05 at 20.41.11.png"
                      alt="Key people mentioned in podcast episode with descriptions"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-24">
              <h3 className="text-2xl font-bold text-white mb-8 text-center">And More Features</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/70 backdrop-blur rounded-xl p-6 border border-slate-700/60">
                  <div className="flex items-center gap-3 mb-3">
                    <List className="w-5 h-5 text-white" />
                    <h4 className="font-semibold text-slate-100">Key Moments</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Automatically extracted highlights and important topics from each episode
                  </p>
                </div>

                <div className="bg-slate-900/70 backdrop-blur rounded-xl p-6 border border-slate-700/60">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-white" />
                    <h4 className="font-semibold text-slate-100">Full Transcript</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Searchable, readable transcript with highlight and copy features
                  </p>
                </div>

                <div className="bg-slate-900/70 backdrop-blur rounded-xl p-6 border border-slate-700/60">
                  <div className="flex items-center gap-3 mb-3">
                    <StickyNote className="w-5 h-5 text-white" />
                    <h4 className="font-semibold text-slate-100">Note Taking</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Listeners can highlight transcript text and save notes while reading
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                What You Get
              </h2>
              <p className="text-lg text-slate-300">
                Everything you need to bring your podcast to life
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-slate-900/70 backdrop-blur rounded-2xl p-8 border border-slate-700/60">
                <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-slate-950" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Beautiful Episode Pages
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Each episode gets its own interactive page with your branding, ready to share or embed anywhere.
                </p>
              </div>

              <div className="bg-slate-900/70 backdrop-blur rounded-2xl p-8 border border-slate-700/60">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-slate-950" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Automatic Publishing
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Pages go live as soon as you publish. Your entire back catalog is processed and ready too.
                </p>
              </div>

              <div className="bg-slate-900/70 backdrop-blur rounded-2xl p-8 border border-slate-700/60">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-slate-950" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Done-For-You Setup
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  We handle everything from setup to ongoing sync. Zero maintenance required from you.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/70 backdrop-blur rounded-2xl p-8 border border-slate-700/60">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mb-4">
                    <Share2 className="w-6 h-6 text-slate-950" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Share Anywhere
                  </h3>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Get a clean URL to share with your audience or embed the pages directly into your website.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/70 border border-slate-700/60 rounded-lg p-4 font-mono">
                    <span className="text-cyan-400">yourpodcast</span>.augmentedpods.com
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-64 h-64 bg-slate-800/70 border border-slate-700/60 rounded-xl flex items-center justify-center">
                    <div className="text-slate-500 text-sm text-center">
                      [Preview mockup]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Why Get This?
              </h2>
              <p className="text-lg text-slate-300">
                Stand out and offer more value to your listeners
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Offer More to Your Listeners</h4>
                  <p className="text-slate-300 text-sm">Give fans an immersive experience beyond just listening</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Bring Your Podcast to Life</h4>
                  <p className="text-slate-300 text-sm">Make episodes more engaging and discoverable</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Build Community</h4>
                  <p className="text-slate-300 text-sm">Give listeners more ways to engage with your content</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Differentiate From Competitors</h4>
                  <p className="text-slate-300 text-sm">Stand out with premium features other shows don't have</p>
                </div>
              </div>

              <div className="flex gap-4 md:col-span-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">No Extra Work</h4>
                  <p className="text-slate-300 text-sm">Everything happens automatically—you just publish episodes as usual</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to elevate your podcast?
            </h2>
            <p className="text-xl text-slate-300 mb-10">
              Get all of this for your podcast with zero ongoing effort
            </p>
            <button
              onClick={onGetStarted}
              className="bg-cyan-500 text-slate-950 px-8 py-4 rounded-lg font-semibold hover:bg-cyan-400 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 text-lg border border-cyan-400/60"
            >
              Get Started Now
              <Sparkles className="w-5 h-5" />
            </button>
            <p className="text-sm text-slate-400 mt-6">
              White-glove setup • Full automation • Live in 48 hours
            </p>
          </div>
        </section>
      </main>

      <PodcastFooter />
    </div>
  );
}
