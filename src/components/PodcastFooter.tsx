import { Radio, Mail } from 'lucide-react';
import { useState } from 'react';
import CreatorContactModal from './CreatorContactModal';

export default function PodcastFooter() {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <footer className="border-t border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-6 h-6 text-white" />
                    <span className="text-xl font-bold text-white">Augmented Pods</span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">
                    Interactive episode pages for podcasters
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <button
                onClick={() => setShowContactModal(true)}
                className="inline-flex items-center gap-2 bg-cyan-500 text-slate-950 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-400 transition-all shadow-md hover:shadow-lg"
              >
                <Mail className="w-5 h-5" />
                I want to augment my podcast
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800/60">
            <p className="text-sm text-slate-400 text-center">
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
