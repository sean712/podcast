import { Radio, Mail } from 'lucide-react';
import { useState } from 'react';
import CreatorContactModal from './CreatorContactModal';

export default function PodcastFooter() {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/Screenshot 2025-11-06 at 15.45.27.png"
                  alt="Augmented Pods"
                  className="h-16 w-auto"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-6 h-6 text-slate-900" />
                    <span className="text-xl font-bold text-slate-900">Augmented Pods</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Interactive episode pages for podcasters
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-slate-700 font-medium mb-3">
                Want this for your podcast?
              </p>
              <button
                onClick={() => setShowContactModal(true)}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
              >
                <Mail className="w-5 h-5" />
                Get Augmented Pods
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              © 2025 Augmented Pods. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {showContactModal && (
        <CreatorContactModal
          onClose={() => setShowContactModal(false)}
        />
      )}
    </>
  );
}
