import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Ambulance,
  Building2,
  Flame,
  Radio,
  Volume2,
} from 'lucide-react';
import { dispatchSosAlert, getStoredMembers } from '../services/storage';

interface SosEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMemberName?: string;
  defaultPhone?: string;
}

/**
 * User Request: "When sos trigered by member no need to fill up form just he can click on trigger sos button"
 * Single-click emergency trigger with zero form inputs.
 */
export const SosEmergencyModal: React.FC<SosEmergencyModalProps> = ({
  isOpen,
  onClose,
  defaultMemberName = '',
  defaultPhone = '',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAlert, setSubmittedAlert] = useState<any | null>(null);
  const [registeredMember, setRegisteredMember] = useState<{ name: string; phone: string; id: string } | null>(null);

  // Check if current device has a registered member
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const storedId = localStorage.getItem('indo_armenia_registered_member_id');
      const allMembers = getStoredMembers();
      if (storedId) {
        const found = allMembers.find((m) => m.id === storedId);
        if (found) {
          setRegisteredMember({
            name: found.fullName,
            phone: `${found.whatsappCountryCode} ${found.whatsappNumber}`,
            id: found.id,
          });
          return;
        }
      }
      if (defaultMemberName || defaultPhone) {
        setRegisteredMember({
          name: defaultMemberName || 'Indian Community Member',
          phone: defaultPhone || 'Emergency Line',
          id: 'GUEST',
        });
      } else {
        setRegisteredMember(null);
      }
    }
  }, [isOpen, defaultMemberName, defaultPhone]);

  if (!isOpen) return null;

  // Single-click trigger without filling up any form
  const handleTriggerSos = async () => {
    setIsSubmitting(true);

    try {
      const alert = await dispatchSosAlert({
        memberName: registeredMember?.name || 'Indian Community Member in Armenia',
        phone: registeredMember?.phone || 'Immediate Emergency Call',
        category: 'distress',
        message: registeredMember
          ? `EMERGENCY SOS Triggered by registered member ${registeredMember.name} (${registeredMember.id})`
          : 'EMERGENCY SOS Triggered via 1-Click Help Button in Armenia',
        location: 'Yerevan, Armenia',
      });
      setSubmittedAlert(alert);
    } catch (err) {
      console.error('Failed to dispatch SOS alert', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedAlert(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-red-500 rounded-3xl max-w-lg w-full text-white shadow-2xl overflow-hidden shadow-red-950/60 relative">
        {/* Flashing Top Red Emergency Bar */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide uppercase text-white leading-none">
                Emergency SOS Help
              </h3>
              <p className="text-[11px] text-red-100 font-semibold mt-0.5">
                Indo-Armenia LLC 24/7 Community Support Line
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {submittedAlert ? (
            /* AFTER TRIGGER: Instant Alert Confirmation */
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-white">
                  🚨 SOS ALERT DISPATCHED!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-300 font-bold mt-1">
                  Audio siren alarm is now sounding on all Admin consoles.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-red-500/40 text-left text-xs space-y-1.5 font-mono shadow-inner">
                <div className="text-slate-400 flex justify-between">
                  <span>Alert ID:</span>
                  <span className="text-amber-400 font-bold">{submittedAlert.id}</span>
                </div>
                <div className="text-slate-400 flex justify-between">
                  <span>Name:</span>
                  <span className="text-white font-semibold">{submittedAlert.memberName}</span>
                </div>
                <div className="text-slate-400 flex justify-between">
                  <span>Status:</span>
                  <span className="text-red-400 font-bold uppercase animate-pulse">Active Emergency Siren</span>
                </div>
                <div className="text-slate-400 flex justify-between">
                  <span>Time:</span>
                  <span className="text-slate-300">{new Date(submittedAlert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Armenian Emergency Numbers */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Dial Direct Armenian Emergency Services:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="tel:102"
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-900/60 border border-slate-700 hover:border-red-500 transition-colors flex flex-col items-center"
                  >
                    <Building2 className="w-4 h-4 text-sky-400 mb-0.5" />
                    <span className="text-[10px] text-slate-300 font-bold uppercase">Police</span>
                    <span className="text-xs font-black text-amber-400">102</span>
                  </a>
                  <a
                    href="tel:103"
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-900/60 border border-slate-700 hover:border-red-500 transition-colors flex flex-col items-center"
                  >
                    <Ambulance className="w-4 h-4 text-red-400 mb-0.5" />
                    <span className="text-[10px] text-slate-300 font-bold uppercase">Ambulance</span>
                    <span className="text-xs font-black text-red-400">103</span>
                  </a>
                  <a
                    href="tel:911"
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-900/60 border border-slate-700 hover:border-red-500 transition-colors flex flex-col items-center"
                  >
                    <Flame className="w-4 h-4 text-orange-400 mb-0.5" />
                    <span className="text-[10px] text-slate-300 font-bold uppercase">Rescue</span>
                    <span className="text-xs font-black text-orange-400">911</span>
                  </a>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-sm uppercase cursor-pointer shadow-lg active:scale-98 transition-all"
              >
                Close & Return
              </button>
            </div>
          ) : (
            /* BEFORE TRIGGER: 1-Click Instant Trigger Button (Zero Form Filling Required) */
            <div className="space-y-5 text-center">
              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-left flex items-start gap-3">
                <Volume2 className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-xs text-red-200">
                  <p className="font-bold text-white mb-0.5">Instant 1-Click Dispatch</p>
                  <p>
                    Clicking the button below will immediately sound an emergency siren on the Indo-Armenia Admin Panel and alert community administrators.
                  </p>
                </div>
              </div>

              {registeredMember && (
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-left text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Triggering As Registered Member:
                  </span>
                  <div className="text-amber-300 font-bold flex items-center justify-between">
                    <span>{registeredMember.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{registeredMember.id}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">{registeredMember.phone}</div>
                </div>
              )}

              {/* User Request: Single Trigger SOS Button - No Form to Fill Up */}
              <button
                onClick={handleTriggerSos}
                disabled={isSubmitting}
                className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-base sm:text-lg tracking-wider uppercase flex flex-col items-center justify-center gap-1.5 shadow-2xl shadow-red-600/60 border-2 border-red-400 active:scale-95 transition-all cursor-pointer disabled:opacity-50 group"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-6 h-6 text-amber-300 animate-bounce" />
                  <span>
                    {isSubmitting ? 'DISPATCHING EMERGENCY ALERT...' : 'TRIGGER SOS ALERT NOW'}
                  </span>
                </div>
                <span className="text-[10px] text-red-200 font-medium normal-case tracking-normal">
                  No form required · Sends instant alert & siren to Admin
                </span>
              </button>

              {/* Direct Armenian Emergency Hotlines */}
              <div className="pt-2 border-t border-slate-800 text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                  Or Call Direct Armenian Hotlines:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="tel:102"
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-red-950/60 border border-slate-800 hover:border-red-500 transition-colors flex flex-col items-center"
                  >
                    <Building2 className="w-4 h-4 text-sky-400 mb-1" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Police</span>
                    <span className="text-sm font-black text-amber-400">102</span>
                  </a>
                  <a
                    href="tel:103"
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-red-950/60 border border-slate-800 hover:border-red-500 transition-colors flex flex-col items-center"
                  >
                    <Ambulance className="w-4 h-4 text-red-400 mb-1" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Ambulance</span>
                    <span className="text-sm font-black text-red-400">103</span>
                  </a>
                  <a
                    href="tel:911"
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-red-950/60 border border-slate-800 hover:border-red-500 transition-colors flex flex-col items-center"
                  >
                    <Flame className="w-4 h-4 text-orange-400 mb-1" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Rescue</span>
                    <span className="text-sm font-black text-orange-400">911</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
