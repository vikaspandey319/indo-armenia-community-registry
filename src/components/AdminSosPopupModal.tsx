import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  Volume2,
  VolumeX,
  Phone,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { SosAlert } from '../types/member';
import { sirenPlayer } from '../utils/sirenAudio';

interface AdminSosPopupModalProps {
  alert: SosAlert | null;
  onResolve: (id: string) => void;
  onDismiss: () => void;
}

export const AdminSosPopupModal: React.FC<AdminSosPopupModalProps> = ({
  alert,
  onResolve,
  onDismiss,
}) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (alert && alert.status === 'active') {
      // Start authentic emergency siren
      sirenPlayer.start();
      setIsMuted(sirenPlayer.getMuted());
    } else {
      sirenPlayer.stop();
    }

    return () => {
      sirenPlayer.stop();
    };
  }, [alert]);

  if (!alert) return null;

  const handleToggleMute = () => {
    const muted = sirenPlayer.toggleMute();
    setIsMuted(muted);
  };

  const handleResolve = () => {
    sirenPlayer.stop();
    onResolve(alert.id);
  };

  const handleDismiss = () => {
    sirenPlayer.stop();
    onDismiss();
  };

  // WhatsApp direct link
  const rawNumber = alert.phone.replace(/[^0-9]/g, '');
  const greeting = encodeURIComponent(
    `🚨 EMERGENCY RESPONSE: Namaste ${alert.memberName}! This is Indo-Armenia LLC Administration responding to your emergency SOS alert Ref: ${alert.id}. Are you safe?`
  );
  const waUrl = `https://wa.me/${rawNumber}?text=${greeting}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-red-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-950 border-4 border-red-500 rounded-3xl max-w-lg w-full text-white shadow-2xl shadow-red-600/60 overflow-hidden ring-8 ring-red-600/30 animate-pulse">
        {/* Blinking Siren Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-red-600 flex items-center justify-center font-black animate-bounce shadow-md">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] tracking-widest uppercase font-black text-amber-200">
                CRITICAL EMERGENCY ALERT
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                SIREN ALARM ACTIVATED
              </h2>
            </div>
          </div>

          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              isMuted
                ? 'bg-slate-900 border-amber-400 text-amber-300'
                : 'bg-white/20 border-white text-white hover:bg-white/30'
            }`}
            title={isMuted ? 'Unmute Siren' : 'Mute Siren'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-[11px] font-black uppercase">{isMuted ? 'Muted' : 'Siren On'}</span>
          </button>
        </div>

        {/* Emergency Body Information */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-red-300 font-bold">ALERT ID: {alert.id}</span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-lg font-black text-white flex items-center gap-2">
              <span>{alert.memberName}</span>
              <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold">
                {alert.category}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-emerald-400 font-mono font-bold">
              <Phone className="w-4 h-4" />
              <span>{alert.phone}</span>
            </div>

            {alert.location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{alert.location}</span>
              </div>
            )}

            <div className="text-xs text-slate-200 bg-slate-950/70 p-2.5 rounded-xl border border-red-500/30">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Details:</div>
              <p className="font-semibold text-white">{alert.message}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Member</span>
              </a>

              <a
                href={`tel:${rawNumber}`}
                className="py-3 px-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Phone</span>
              </a>
            </div>

            <button
              onClick={handleResolve}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>Mark SOS Resolved & Silence Siren</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Minimize Popup (Siren Silenced)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
