import { Radio } from 'lucide-react';

export default function PodcastFooter() {
  return (
    <footer className="border-t border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Radio className="w-6 h-6 text-white" />
              <span className="text-xl font-bold text-white">Augmented Pods</span>
            </div>
            <p className="text-sm text-slate-300 text-center">
              Interactive episode pages for podcasters
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800/60 w-full max-w-2xl">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Augmented Pods is not affiliated with this podcast or its creators. This page is provided as a third-party enhancement to the listening experience.
            </p>
          </div>

          <p className="text-sm text-slate-400 text-center">
            © 2025 Augmented Pods. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
