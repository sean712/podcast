import { Radio, Sparkles, Clock, Share2, Zap, CheckCircle2, Map, Users as UsersIcon, List, StickyNote, BookOpen } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-7 h-7 text-slate-900" />
              <span className="text-xl font-bold text-slate-900">Augmented Pods</span>
            </div>
            <button
              onClick={onSignIn}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                Beautiful interactive pages for every episode
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                Give your listeners more than just audio. Automated, branded episode pages with AI-powered features—no extra work required.
              </p>
              <button
                onClick={onGetStarted}
                className="bg-slate-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 text-lg"
              >
                Get This For Your Podcast
                <Sparkles className="w-5 h-5" />
              </button>
              <p className="text-sm text-slate-500 mt-4">
                Setup handled by us • Live in 48 hours
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                What You Get
              </h2>
              <p className="text-lg text-slate-600">
                Everything you need to bring your podcast to life
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-xl p-8 border border-slate-200">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-slate-900" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Beautiful Episode Pages
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Each episode gets its own interactive page with your branding, ready to share or embed anywhere.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-slate-200">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-slate-900" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Automatic Publishing
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Pages go live as soon as you publish. Your entire back catalog is processed and ready too.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-slate-200">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-slate-900" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Done-For-You Setup
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  We handle everything from setup to ongoing sync. Zero maintenance required from you.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                    <Share2 className="w-6 h-6 text-slate-900" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                    Share Anywhere
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Get a clean URL to share with your audience or embed the pages directly into your website.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-4 font-mono">
                    yourpodcast.augmentedpods.com
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center">
                    <div className="text-slate-400 text-sm text-center">
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
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                Why Get This?
              </h2>
              <p className="text-lg text-slate-600">
                Stand out and offer more value to your listeners
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-900" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Offer More to Your Listeners</h4>
                  <p className="text-slate-600 text-sm">Give fans an immersive experience beyond just listening</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-900" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Bring Your Podcast to Life</h4>
                  <p className="text-slate-600 text-sm">Make episodes more engaging and discoverable</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-900" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Build Community</h4>
                  <p className="text-slate-600 text-sm">Give listeners more ways to engage with your content</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-900" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Differentiate From Competitors</h4>
                  <p className="text-slate-600 text-sm">Stand out with premium features other shows don't have</p>
                </div>
              </div>

              <div className="flex gap-4 md:col-span-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-900" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">No Extra Work</h4>
                  <p className="text-slate-600 text-sm">Everything happens automatically—you just publish episodes as usual</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                Interactive Features
              </h2>
              <p className="text-lg text-slate-600">
                AI-powered tools that make each episode more engaging
              </p>
            </div>

            <div className="space-y-24">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Map className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Interactive Location Map</h3>
                  </div>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    Every place mentioned in your episode is automatically mapped and displayed on a beautiful satellite view. Listeners can explore locations, see context, and understand the geographic story behind your content.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Automatic location extraction from transcript</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Satellite imagery with numbered markers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Context and quotes for each location</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
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
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Smart Timeline</h3>
                  </div>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    AI identifies the most important moments and creates a chronological timeline of events discussed in your episode. Perfect for historical content, storytelling, and narrative podcasts.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Chronological event extraction</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Expandable details for each moment</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Visual timeline with dates and context</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
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
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Key People</h3>
                  </div>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    Every person mentioned gets their own card with AI-generated descriptions, roles, and relevant quotes from the episode. Helps listeners keep track of who's who in complex stories.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Automatic person identification</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Role and context descriptions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">Relevant quotes and mentions</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
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
              <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">And More Features</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <List className="w-5 h-5 text-slate-900" />
                    <h4 className="font-semibold text-slate-900">Key Moments</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Automatically extracted highlights and important topics from each episode
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-slate-900" />
                    <h4 className="font-semibold text-slate-900">Full Transcript</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Searchable, readable transcript with highlight and copy features
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <StickyNote className="w-5 h-5 text-slate-900" />
                    <h4 className="font-semibold text-slate-900">Note Taking</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Listeners can highlight transcript text and save notes while reading
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to elevate your podcast?
            </h2>
            <p className="text-xl text-slate-300 mb-10">
              Get all of this for your podcast with zero ongoing effort
            </p>
            <button
              onClick={onGetStarted}
              className="bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 text-lg"
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

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-6 h-6 text-slate-900" />
              <span className="font-semibold text-slate-900">Augmented Pods</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2025 Augmented Pods. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
