import { useState } from 'react';
import { X, Radio, CheckCircle, Sparkles } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creator Contact Form Submission:', formData);
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
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {isSubmitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You!
            </h3>
            <p className="text-gray-600">
              We've received your inquiry and will be in touch within 24 hours to discuss your podcast space.
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Radio className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Get Your Podcast Space</h2>
                    <p className="text-sm text-gray-600">White-glove onboarding included</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Premium Service Included</p>
                  <p className="text-blue-700">We handle everything - from setup to ongoing episode syncing. Your podcast space will be live within 48 hours.</p>
                </div>
              </div>

              <div>
                <label htmlFor="podcastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Podcast Name *
                </label>
                <input
                  type="text"
                  id="podcastName"
                  name="podcastName"
                  required
                  value={formData.podcastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="The Joe Rogan Experience"
                />
              </div>

              <div>
                <label htmlFor="creatorName" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="creatorName"
                  name="creatorName"
                  required
                  value={formData.creatorName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="jane@podcast.com"
                />
              </div>

              <div>
                <label htmlFor="podcastUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Podcast RSS Feed or URL *
                </label>
                <input
                  type="url"
                  id="podcastUrl"
                  name="podcastUrl"
                  required
                  value={formData.podcastUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://feeds.example.com/podcast.xml"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Information (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell us about your podcast and what you're looking for..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
              >
                Submit Inquiry
              </button>

              <p className="text-xs text-center text-gray-500">
                By submitting, you agree to be contacted about your podcast space.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
