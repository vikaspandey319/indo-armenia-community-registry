import React, { useState } from 'react';
import { CrestLogo } from './CrestLogo';
import {
  Download,
  X,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Globe,
  Monitor,
  Sparkles,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isInstalled: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isIOS,
  isAndroid,
  isInstalled,
}) => {
  // Device tab: 'android' | 'ios' | 'desktop'
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'android'
  );
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const accepted = await onInstall();
      if (accepted) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
      >
        {/* Top Decorative Flag Ribbon */}
        <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-amber-300 via-emerald-600 via-red-600 via-blue-600 to-amber-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-3 relative">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-inner shrink-0">
              <CrestLogo size={48} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Official Mobile App
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" /> PWA Ready
                </span>
              </div>
              <h2
                id="install-modal-title"
                className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5"
              >
                Install Indo-Armenia App
              </h2>
              <p className="text-xs text-slate-300">
                Maro Margaryan 14, Yerevan · Indian Community Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Key Advantages Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">1-Tap Fast Launch</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Opens instantly without typing URL</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Offline ID Card</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Carry your ID even with no internet</p>
              </div>
            </div>
          </div>

          {/* Quick Install Action Button (Native Chromium / Android / Desktop) */}
          {isInstallable && !installSuccess && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-2 border-emerald-500/70 text-center shadow-lg">
              <div className="text-xs font-bold text-emerald-300 mb-1.5 flex items-center justify-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Direct 1-Click Install Available</span>
              </div>
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
              >
                <Download className="w-5 h-5 animate-bounce" />
                <span>{isInstalling ? 'Installing...' : 'INSTALL APP TO HOME SCREEN'}</span>
              </button>
            </div>
          )}

          {installSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm">App successfully installed on your device!</span>
            </div>
          )}

          {/* Platform Tab Switcher */}
          <div className="pt-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Installation Steps by Device</span>
              <span className="text-[10px] text-amber-400 normal-case font-normal">Works on all phones & PCs</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActivePlatform('android')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activePlatform === 'android'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setActivePlatform('ios')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activePlatform === 'ios'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Share className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>

              <button
                onClick={() => setActivePlatform('desktop')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activePlatform === 'desktop'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC / Laptop</span>
              </button>
            </div>
          </div>

          {/* Platform Specific Step Instructions */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-xs space-y-3">
            {activePlatform === 'android' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="text-slate-300">
                    {isInstallable
                      ? 'Tap the green "INSTALL APP TO HOME SCREEN" button above.'
                      : 'Open Chrome or your browser menu (tap the 3 vertical dots ⋮ in the top right).'}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="text-slate-300">
                    Select <strong className="text-amber-300">"Install app"</strong> or{' '}
                    <strong className="text-amber-300">"Add to Home screen"</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="text-slate-300">
                    The official <strong>Indo-Armenia LLC</strong> icon will appear on your phone's home screen!
                  </p>
                </div>
              </div>
            )}

            {activePlatform === 'ios' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="text-slate-300">
                    In Apple Safari, tap the <strong className="text-sky-300">Share button</strong> (the square with an arrow pointing up{' '}
                    <span className="inline-block px-1 py-0.5 bg-slate-800 rounded text-sky-400">⎙</span> at the bottom of Safari).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="text-slate-300">
                    Scroll down and tap <strong className="text-amber-300">"Add to Home Screen"</strong> with the plus{' '}
                    <span className="inline-block px-1 py-0.5 bg-slate-800 rounded text-amber-400">⊞</span> icon.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="text-slate-300">
                    Tap <strong className="text-emerald-300">"Add"</strong> in the top right corner. The app is now installed on your iPhone/iPad!
                  </p>
                </div>
              </div>
            )}

            {activePlatform === 'desktop' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="text-slate-300">
                    On Chrome, Edge, or Brave, look at the right end of the address bar at the top of your screen.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="text-slate-300">
                    Click the <strong className="text-amber-300">Install App icon</strong> (a computer monitor with a down arrow, or plus icon).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="text-slate-300">
                    Confirm "Install". Indo-Armenia LLC will launch in its own native standalone window!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Fast, safe & zero app store login needed</span>
          </div>

          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Continue to Web App
          </button>
        </div>
      </div>
    </div>
  );
};
