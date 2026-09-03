import React, { useState, useEffect } from 'react';
import { X, Instagram, Play } from 'lucide-react';

const REEL_URL = 'https://www.instagram.com/reel/DcsZ2LGKilW/';
const REEL_ID = 'DcsZ2LGKilW';

// How long before the widget auto-appears (ms)
const SHOW_DELAY = 2500;

export default function InstagramReelWidget() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Auto-show after delay, only if not dismissed in this session
  useEffect(() => {
    if (sessionStorage.getItem('ig_widget_dismissed')) {
      return;
    }
    const t = setTimeout(() => setVisible(true), SHOW_DELAY);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('ig_widget_dismissed', '1');
  };

  if (dismissed || !visible) return null;

  return (
    <div
      className={`fixed bottom-6 right-4 z-[200] flex flex-col items-end gap-2 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
      style={{ filter: 'drop-shadow(0 8px 32px rgba(255,45,116,0.25))' }}
    >
      {/* Label tag — shown when not expanded */}
      {!expanded && (
        <div
          className="flex items-center gap-1.5 bg-white border border-[#FFD1E3] rounded-full px-3 py-1.5 cursor-pointer hover:border-[#FF2D74] transition-colors animate-bounce"
          style={{ animationDuration: '2s' }}
          onClick={() => setExpanded(true)}
        >
          <Instagram size={12} className="text-[#FF2D74]" />
          <span className="text-[10px] font-bold text-[#B3184F] whitespace-nowrap">Watch our Reel ✨</span>
        </div>
      )}

      {/* Widget card */}
      <div
        className={`relative bg-white rounded-2xl border-2 border-[#FFD1E3] overflow-hidden transition-all duration-300 cursor-pointer ${
          expanded
            ? 'w-[280px] shadow-2xl'
            : 'w-[72px] h-[72px] rounded-full border-[#FF2D74]'
        }`}
        onClick={() => !expanded && setExpanded(true)}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          aria-label="Close Instagram widget"
        >
          <X size={12} />
        </button>

        {/* Collapsed pill — Instagram avatar style */}
        {!expanded && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF2D74] via-[#FF7A3D] to-[#FCAF45]">
            <Instagram size={28} className="text-white" />
          </div>
        )}

        {/* Expanded preview */}
        {expanded && (
          <>
            {/* Instagram gradient header */}
            <div className="bg-gradient-to-r from-[#FF2D74] via-[#FF7A3D] to-[#FCAF45] px-3 py-2.5 flex items-center gap-2">
              <Instagram size={16} className="text-white" />
              <div>
                <p className="text-white text-[11px] font-bold leading-tight">@stringsandstrands</p>
                <p className="text-white/70 text-[9px]">Latest Reel</p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="ml-auto text-white/70 hover:text-white transition-colors"
                aria-label="Collapse"
              >
                <X size={14} />
              </button>
            </div>

            {/* Embed preview area */}
            <div className="relative bg-black" style={{ aspectRatio: '9/14' }}>
              <iframe
                src={`https://www.instagram.com/reel/${REEL_ID}/embed/captioned/`}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                allowTransparency={true}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                style={{ display: 'block', border: 'none' }}
                title="Instagram Reel"
              />
            </div>

            {/* CTA button */}
            <a
              href={REEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#FF2D74] hover:bg-[#B3184F] text-white text-[11px] font-bold tracking-wider uppercase transition-colors"
            >
              <Play size={11} fill="white" />
              Watch on Instagram
            </a>
          </>
        )}
      </div>
    </div>
  );
}
