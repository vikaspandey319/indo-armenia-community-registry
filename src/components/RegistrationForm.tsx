import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { AppLanguage, Member } from '../types/member';
import { translations } from '../utils/translations';
import { compressImageFile } from '../utils/crypto';
import { registerNewMember } from '../services/storage';
import { DigitalIdCard } from './DigitalIdCard';
import { SupportRequestModal } from './SupportRequestModal';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  User,
  Sparkles,
  RefreshCw,
  LifeBuoy,
  Download,
  Users,
} from 'lucide-react';

interface RegistrationFormProps {
  language: AppLanguage;
  onSuccess: (member: Member) => void;
  existingMemberIds?: string[];
  onOpenInstallModal?: () => void;
  onViewMembers?: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  language,
  onSuccess,
  onOpenInstallModal,
  onViewMembers,
}) => {
  const t = translations[language];

  // Form State
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('India'); // Home country
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+91');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [arrivalDateInArmenia, setArrivalDateInArmenia] = useState('');
  const [agentOrAgencyName, setAgentOrAgencyName] = useState('');

  // Photo Upload State
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission & Support State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdMember, setCreatedMember] = useState<Member | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle Photo Selection
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    try {
      setIsCompressingPhoto(true);
      setErrorMessage('');
      const compressed = await compressImageFile(file);
      setPhotoDataUrl(compressed);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not process this image. Please try another photo.');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleClearPhoto = () => {
    setPhotoDataUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Field Validations
    if (!fullName.trim()) {
      setErrorMessage('Please enter your Full Name as per your ID or Passport.');
      return;
    }
    if (!photoDataUrl) {
      setErrorMessage('Please upload a photo for your official Membership ID card.');
      return;
    }
    if (!country.trim()) {
      setErrorMessage('Please enter your Home country.');
      return;
    }
    if (!whatsappNumber.trim() || whatsappNumber.replace(/\D/g, '').length < 6) {
      setErrorMessage('Please enter a valid WhatsApp number (minimum 6 digits).');
      return;
    }
    if (!arrivalDateInArmenia.trim()) {
      setErrorMessage('Please enter your Arrival Date in Armenia.');
      return;
    }
    if (!agentOrAgencyName.trim()) {
      setErrorMessage('Please enter Agency / Agent Name (home country) or Direct.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newMember = await registerNewMember({
        fullName: fullName.trim(),
        photoUrl: photoDataUrl,
        country: country.trim(),
        whatsappCountryCode,
        whatsappNumber: whatsappNumber.trim().replace(/\s+/g, ''),
        arrivalDateInArmenia: arrivalDateInArmenia.trim(),
        agentOrAgencyName: agentOrAgencyName.trim(),
      });

      // Save registration state so member can view community members
      if (typeof window !== 'undefined') {
        localStorage.setItem('indo_armenia_registered_member_id', newMember.id);
      }

      setCreatedMember(newMember);
      onSuccess(newMember);

      // Celebration
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#FF9933', '#FFFFFF', '#138808', '#D90012', '#0033A0', '#F2A800'],
        });
      } catch (_) {}
    } catch (err) {
      console.error(err);
      setErrorMessage('An unexpected error occurred while saving. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCreatedMember(null);
    setFullName('');
    setCountry('India');
    setWhatsappNumber('');
    setArrivalDateInArmenia('');
    setAgentOrAgencyName('');
    setPhotoDataUrl('');
    setErrorMessage('');
  };

  // Success Screen (After Registration: Digital ID Card + "Request For Support" Button)
  if (createdMember) {
    return (
      <div className="max-w-xl mx-auto py-3 sm:py-6 px-3 sm:px-4">
        <div className="bg-white rounded-3xl border-2 border-amber-400/60 shadow-xl p-4 sm:p-6 text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-400 via-emerald-500 via-red-600 to-blue-600" />

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.successTitle}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              {t.successSubtitle}
            </p>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3 max-w-md mx-auto">
              Your registration is pending administrator approval. Your member directory access will activate after approval.
            </p>
          </div>

          {/* Digital ID Card */}
          <div className="pt-1">
            <DigitalIdCard member={createdMember} />
          </div>

          {/* User Request: After Registration Member will see Request For support Button & Install App & View Members */}
          <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5">
            {onViewMembers && (
              <button
                type="button"
                onClick={onViewMembers}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Users className="w-4 h-4 text-blue-200" />
                <span>View All Community Members</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSupportModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LifeBuoy className="w-4 h-4 text-amber-200 animate-pulse" />
              <span>Request For Support</span>
            </button>

            {onOpenInstallModal && (
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] border border-emerald-300"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Install App on Phone</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.registerAnotherButton}</span>
            </button>
          </div>
        </div>

        {/* Support Request Modal */}
        <SupportRequestModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
          member={createdMember}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-4 px-2.5 sm:px-4">
      {/* Mobile-Fitted Registration Form: No middle company details, directly ready to fill */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-md p-3.5 sm:p-5 space-y-3 relative overflow-hidden"
      >
        {/* Top vibrant accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 via-emerald-500 via-red-600 to-blue-600" />

        {/* Form Title Heading */}
        <div className="pt-1 pb-0.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
              Member Registration
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Indian Community Digital Registry
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Official
          </span>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-bold">{errorMessage}</div>
          </div>
        )}

        {/* 1. Upload Photo */}
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-blue-50/40 border border-amber-200/70">
          <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>{t.photoUploadLabel}</span>
          </label>
          <div className="flex items-center gap-3">
            {/* Photo Preview Box */}
            <div className="w-14 h-16 sm:w-16 sm:h-20 shrink-0 rounded-lg overflow-hidden border-2 border-amber-400 shadow-xs bg-white flex items-center justify-center relative">
              {photoDataUrl ? (
                <img
                  src={photoDataUrl}
                  alt="Member Preview"
                  className="w-full h-full object-cover"
                />
              ) : isCompressingPhoto ? (
                <div className="text-[9px] text-amber-600 animate-pulse font-bold text-center">
                  ...
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <User className="w-5 h-5" />
                  <span className="text-[8px] font-bold">Photo</span>
                </div>
              )}
            </div>

            {/* Upload Buttons */}
            <div className="flex-1 space-y-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFileChange}
                className="hidden"
                id="member-photo-input"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="member-photo-input"
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white cursor-pointer transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoDataUrl ? t.photoChangeLabel : 'Upload Photo'}</span>
                </label>
                {photoDataUrl && (
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Clear portrait photo for ID badge</p>
            </div>
          </div>
        </div>

        {/* 2. Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>{t.fullNameLabel}</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t.fullNamePlaceholder}
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-semibold shadow-2xs"
          />
        </div>

        {/* 3. Home Country */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>{t.countryLabel}</span>
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-semibold bg-white shadow-2xs"
          >
            <option value="India">🇮🇳 India (भारत)</option>
            <option value="Armenia">🇦🇲 Armenia (Հայաստան)</option>
            <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
            <option value="Georgia">🇬🇪 Georgia</option>
            <option value="Russia">🇷🇺 Russia</option>
            <option value="Other">Other Country</option>
          </select>
        </div>

        {/* 4. WhatsApp No */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t.whatsappLabel}</span>
          </label>
          <div className="flex gap-2">
            <select
              value={whatsappCountryCode}
              onChange={(e) => setWhatsappCountryCode(e.target.value)}
              className="w-28 px-2 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 text-xs font-mono font-bold shadow-2xs"
              aria-label="WhatsApp Country Code"
            >
              <option value="+91">🇮🇳 +91</option>
              <option value="+374">🇦🇲 +374</option>
              <option value="+971">🇦🇪 +971</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+7">🇷🇺 +7</option>
              <option value="+995">🇬🇪 +995</option>
            </select>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder={t.whatsappPlaceholder}
              required
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-mono font-bold shadow-2xs"
            />
          </div>
        </div>

        {/* 5. Arrival date in Armenia */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{t.arrivalDateLabel}</span>
          </label>
          <input
            type="date"
            value={arrivalDateInArmenia}
            onChange={(e) => setArrivalDateInArmenia(e.target.value)}
            placeholder={t.arrivalDatePlaceholder}
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-semibold bg-white shadow-2xs"
          />
        </div>

        {/* 6. Agency / Agent Name (home country) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span>{t.agentNameLabel}</span>
          </label>
          <input
            type="text"
            value={agentOrAgencyName}
            onChange={(e) => setAgentOrAgencyName(e.target.value)}
            placeholder={t.agentNamePlaceholder}
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-semibold shadow-2xs"
          />
        </div>

        {/* Security / Cloud storage notice */}
        <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[10px] text-emerald-900 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Registration details are sent securely to the community database. Only encrypted backups use AES-256.
          </span>
        </div>

        {/* Submit Button */}
        <div className="pt-0.5">
          <button
            type="submit"
            disabled={isSubmitting || isCompressingPhoto}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:via-orange-700 hover:to-amber-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>{t.submittingButton}</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{t.submitButton}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
