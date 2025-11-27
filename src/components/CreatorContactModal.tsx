import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CreatorContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatorContactModal({ isOpen, onClose }: CreatorContactModalProps) {
  const [formData, setFormData] = useState({
    podcastName: '',
    creatorName: '',
    email: '',
    podcastUrl: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setFormData({
          podcastName: '',
          creatorName: '',
          email: '',
          podcastUrl: '',
          message: '',
        });
      }, 2500);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-3">
            Thank You!
          </h3>
          <p className="text-slate-600 text-lg leading-relaxed">
            We've received your inquiry and will be in touch within 24 hours to discuss your podcast.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex max-h-[90vh]">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-500 via-cyan-600 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(15,23,42,0.3),transparent_50%)]" />

          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 border border-white/20">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Ready to elevate your podcast?
            </h2>
            <p className="text-cyan-50 text-lg leading-relaxed">
              Join podcast creators who are giving their listeners beautiful, interactive episode pages. We'll handle everything.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">White-Glove Setup</h3>
                <p className="text-cyan-50/80 text-sm">We handle everything from integration to launch</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Live in 48 Hours</h3>
                <p className="text-cyan-50/80 text-sm">Fast turnaround with your entire back catalog included</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Zero Maintenance</h3>
                <p className="text-cyan-50/80 text-sm">Automatic syncing for every new episode you publish</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="lg:hidden">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Get started today
            </h2>
            <p className="text-slate-600">
              Share a few details and we'll set up your podcast space
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 flex-1">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="podcastName" className="block text-sm font-semibold text-slate-700 mb-2">
                Podcast Name
              </label>
              <input
                type="text"
                id="podcastName"
                name="podcastName"
                required
                value={formData.podcastName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="The Joe Rogan Experience"
              />
            </div>

            <div>
              <label htmlFor="creatorName" className="block text-sm font-semibold text-slate-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="creatorName"
                name="creatorName"
                required
                value={formData.creatorName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="jane@podcast.com"
              />
            </div>

            <div>
              <label htmlFor="podcastUrl" className="block text-sm font-semibold text-slate-700 mb-2">
                Podcast RSS Feed or URL
              </label>
              <input
                type="url"
                id="podcastUrl"
                name="podcastUrl"
                required
                value={formData.podcastUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="https://feeds.example.com/podcast.xml"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                Additional Details <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none"
                placeholder="Tell us about your podcast..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-800 text-white py-3.5 rounded-lg font-semibold hover:bg-slate-900 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit Inquiry'
              )}
            </button>

            <p className="text-xs text-center text-slate-500 pt-2">
              By submitting, you agree to be contacted about your podcast space.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
