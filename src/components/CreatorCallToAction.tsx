import { useState } from 'react';
import { Sparkles, Check, MessageCircle } from 'lucide-react';
import CreatorContactModal from './CreatorContactModal';

export default function CreatorCallToAction() {
  const [showContactModal, setShowContactModal] = useState(false);

  const features = [
    'Full transcripts with AI-powered analysis',
    'Interactive maps showing locations mentioned',
    'Timeline of events and key moments',
    'Key people with Wikipedia integration',
    'Smart references and citations',
    'Enhanced listener engagement',
  ];

  return (
    <>
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-400/30 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-emerald-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Is this your podcast?
          </h3>
          <p className="text-slate-300 text-lg">
            Turn every episode into an Augmented Pod
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
              <span className="text-slate-200 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30"
          >
            <MessageCircle className="w-5 h-5" />
            Get in touch
          </button>
          <p className="text-slate-400 text-sm mt-3">
            Join the growing list of podcasts using Augmented Pods
          </p>
        </div>
      </div>

      <CreatorContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </>
  );
}
