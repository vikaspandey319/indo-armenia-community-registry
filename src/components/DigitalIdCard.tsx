import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Member } from '../types/member';
import { CrestLogo } from './CrestLogo';
import {
  Download,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  MapPin,
  Briefcase,
  Phone,
  Sparkles,
} from 'lucide-react';

interface DigitalIdCardProps {
  member: Member;
  onPrint?: () => void;
  onClose?: () => void;
}

export const DigitalIdCard: React.FC<DigitalIdCardProps> = ({ member, onPrint, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Generate high resolution scannable QR Code
    const verifyPayload = JSON.stringify({
      id: member.id,
      name: member.fullName,
      org: 'Indo Armenia LLC',
      status: member.verificationStatus,
      country: member.country,
      arrivalDate: member.arrivalDateInArmenia,
      agency: member.agentOrAgencyName,
      hash: member.checksum ? member.checksum.slice(0, 12) : 'VERIFIED',
    });

    QRCode.toDataURL(verifyPayload, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Error generating QR code', err));
  }, [member]);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Namaste! Here is my official Indo Armenia LLC Indian Community Membership ID Card.\n\nMember Name: ${member.fullName}\nMember ID: ${member.id}\nArrival in Armenia: ${member.arrivalDateInArmenia}\nAgency / Agent: ${member.agentOrAgencyName}\nHome Country: ${member.country}\nVerified by Indo Armenia LLC - Global Partnership.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(member.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Physical Card Container (printable-card-area for print styling) */}
      <div
        ref={cardRef}
        className="printable-card-area w-full max-w-md bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-500/50 relative select-none"
      >
        {/* Colorful top border ribbon representing India & Armenia flag colors */}
        <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-white via-emerald-600 via-red-600 via-blue-600 to-amber-400" />

        {/* Subtle Guilloche / Security pattern overlay */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #f59e0b 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Card Header Strip with Official Crossed Flags Logo */}
        <div className="relative z-10 px-5 pt-3.5 pb-2.5 flex items-center justify-between border-b border-amber-500/30 bg-black/70 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <CrestLogo size={48} />
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-400 font-black font-sans leading-none">
                Indo Armenia LLC
              </div>
              <div className="text-[9px] text-sky-200 tracking-[0.2em] uppercase font-bold mt-0.5">
                Global Partnership
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
              Status
            </span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative z-10 p-5">
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Member Photo with Gold Security Frame */}
            <div className="col-span-4 flex flex-col items-center">
              <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-amber-400 shadow-lg bg-slate-900 relative">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                    No Photo
                  </div>
                )}
                {/* Hologram stamp */}
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-300 to-cyan-300 opacity-90 shadow-xs flex items-center justify-center text-[7px] text-slate-950 font-black">
                  ★
                </div>
              </div>
              <span className="text-[9px] text-amber-300/90 mt-1 font-mono font-bold">
                SECURE ID
              </span>
            </div>

            {/* Member Identity Details */}
            <div className="col-span-8 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Member Name
                </span>
                <h3 className="text-base font-extrabold text-white tracking-tight leading-snug line-clamp-2">
                  {member.fullName}
                </h3>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Arrival in Armenia
                </span>
                <p className="text-xs font-bold text-amber-400 truncate">
                  {member.arrivalDateInArmenia}
                </p>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Agency / Agent (Home Country)
                </span>
                <p className="text-xs font-semibold text-sky-200 line-clamp-2">
                  {member.agentOrAgencyName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Home Country
                  </span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {member.country}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                    WhatsApp No
                  </span>
                  <span className="font-mono text-slate-200 font-bold tabular-nums truncate block">
                    {member.whatsappCountryCode} {member.whatsappNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Member ID Barcode & QR Code Section */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-semibold">
                Official Registration ID
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-extrabold text-amber-400 tracking-wider tabular-nums">
                  {member.id}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-[10px] text-slate-400 hover:text-white underline underline-offset-2 no-print"
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                Issued: {new Date(member.registeredAt).toLocaleDateString()} · Indo Armenia LLC
              </div>
            </div>

            {/* Scannable QR Code */}
            <div className="shrink-0 bg-white p-1 rounded-xl shadow-md">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code Verification"
                  className="w-14 h-14"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 bg-slate-200 animate-pulse rounded-lg" />
              )}
            </div>
          </div>
        </div>

        {/* Card Footer Stripe */}
        <div className="px-5 py-2 bg-black border-t border-amber-500/20 flex items-center justify-between text-[9px] text-slate-300">
          <span className="font-medium text-amber-200">Maro Margaryan 14, Yerevan, Armenia</span>
          <span className="font-mono text-amber-400">Indo Armenia LLC</span>
        </div>
      </div>

      {/* Action Controls for User */}
      <div className="flex flex-wrap items-center justify-center gap-3 no-print w-full max-w-md">
        <button
          onClick={handlePrint}
          className="flex-1 min-w-[120px] px-4 py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Print Card</span>
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="flex-1 min-w-[120px] px-4 py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Close Card View
          </button>
        )}
      </div>
    </div>
  );
};
