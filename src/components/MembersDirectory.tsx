import React, { useState, useMemo, useEffect } from 'react';
import { Member } from '../types/member';
import { CrestLogo } from './CrestLogo';
import { Users, Lock, ShieldCheck, UserPlus, ArrowRight, CheckCircle2, Search, X, RefreshCw, Home } from 'lucide-react';

interface MembersDirectoryProps {
  members: Member[];
  onRegisterClick?: () => void;
  onHomeClick?: () => void;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

/**
 * Members Directory View
 * User Request: Members section remove big top heading just keep single line Registered indian comunity members also create home button in members page
 */
export const MembersDirectory: React.FC<MembersDirectoryProps> = ({
  members,
  onRegisterClick,
  onHomeClick,
  isAdmin = false,
  onRefresh,
}) => {
  // Check if current user is registered on this device/browser
  const [registeredMemberId, setRegisteredMemberId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('indo_armenia_registered_member_id');
    }
    return null;
  });

  // Keep registered member id updated when component updates or localStorage changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('indo_armenia_registered_member_id');
      if (stored !== registeredMemberId) {
        setRegisteredMemberId(stored);
      }
    }
  }, [members, registeredMemberId]);

  // State for verification form if member registered earlier or on another device
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Is user authorized to view the directory (either just registered, saved in localStorage, or Admin)
  const isAuthorized = isAdmin || Boolean(registeredMemberId);

  // Quick verification handler for already-registered members
  const handleVerifyRegisteredMember = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccess('');

    const cleanInput = verifyInput.trim().toLowerCase();
    const cleanDigits = verifyInput.replace(/\D/g, '');

    if (!cleanInput) {
      setVerifyError('Please enter your Member ID or WhatsApp number.');
      return;
    }

    // Match by ID or by WhatsApp number
    const matched = members.find((m) => {
      const matchId = m.id.toLowerCase() === cleanInput;
      const matchPhone = cleanDigits.length >= 6 && m.whatsappNumber.replace(/\D/g, '').includes(cleanDigits);
      return matchId || matchPhone;
    });

    if (matched) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('indo_armenia_registered_member_id', matched.id);
      }
      setRegisteredMemberId(matched.id);
      setVerifySuccess(`Welcome back, ${matched.fullName}! Verification successful.`);
    } else {
      setVerifyError('No registered member found matching this ID or phone number. Please register first.');
    }
  };

  // Filter members if search query is entered
  const displayedMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      (m) => m.fullName.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-6">
      {/* User Request: Single line "Registered indian comunity members" + Home button */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-2.5 sm:p-3.5 text-white border-2 border-blue-500/50 shadow-xl flex items-center justify-between gap-2.5 sm:gap-4 relative overflow-hidden">
        {/* Home Button */}
        <button
          onClick={onHomeClick || onRegisterClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer shrink-0 border border-blue-400/50"
          title="Return to Home / Register"
        >
          <Home className="w-4 h-4 text-amber-300" />
          <span>Home</span>
        </button>

        {/* Single Line Heading: Registered Indian Community Members */}
        <div className="flex items-center gap-2 min-w-0 justify-center flex-1 text-center">
          <h1 className="text-xs sm:text-base md:text-lg font-black text-white truncate tracking-tight whitespace-nowrap">
            Registered Indian Community Members
          </h1>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/50 text-amber-300 font-mono text-xs sm:text-sm font-black whitespace-nowrap tabular-nums shrink-0">
            {members.length}
          </span>
        </div>

        {/* Real-time sync action */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-blue-200 border border-blue-500/40 text-xs font-bold transition-all cursor-pointer shadow active:scale-95"
              title="Refresh roster in real-time"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline text-[11px]">Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* STATE 1: GATED (BEFORE REGISTRATION) */}
      {!isAuthorized ? (
        <div className="max-w-xl mx-auto bg-slate-900/90 rounded-3xl border-2 border-blue-500/40 p-6 sm:p-8 text-center space-y-5 shadow-xl text-white">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Registered Members Only
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed max-w-md mx-auto">
              After registration only, members can view other community members’ photo, ID, and name.
            </p>
          </div>

          {/* Primary CTA: Register Now */}
          {onRegisterClick && (
            <button
              onClick={onRegisterClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Now to View Members</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          )}

          {/* Secondary Quick Unlock: Already Registered? */}
          <div className="pt-4 border-t border-slate-800 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Already registered? Enter your Member ID or Phone to unlock:
            </span>
            <form onSubmit={handleVerifyRegisteredMember} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  placeholder="Member ID (e.g. IA-IND-2026-...) or Phone"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shrink-0 transition-colors"
                >
                  Unlock
                </button>
              </div>

              {verifyError && (
                <p className="text-[11px] text-red-400 font-semibold text-center">{verifyError}</p>
              )}
              {verifySuccess && (
                <p className="text-[11px] text-emerald-400 font-semibold text-center">{verifySuccess}</p>
              )}
            </form>
          </div>
        </div>
      ) : (
        /* STATE 2: UNLOCKED (AFTER REGISTRATION) */
        <div className="space-y-4">
          {/* Quick Search Bar */}
          <div className="bg-slate-900/90 p-3 sm:p-3.5 rounded-2xl border border-blue-500/30 shadow-md flex items-center gap-3">
            <Search className="w-4 h-4 text-blue-300 shrink-0 ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or ID (e.g. IA-IND-2026)..."
              className="w-full text-xs sm:text-sm font-medium text-white placeholder-slate-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Members Grid: PHOTO, ID, AND NAME ONLY - NO OTHER THING ON DISPLAY */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {displayedMembers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-slate-900/70 rounded-2xl border border-slate-800 p-6 text-white">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-300">No members found</h3>
                <p className="text-xs text-slate-500 mt-1">Try another search name or ID</p>
              </div>
            ) : (
              displayedMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-900/95 rounded-2xl border border-blue-500/30 hover:border-amber-400/80 p-3 flex flex-col items-center text-center shadow-lg transition-all group"
                >
                  {/* 1. PHOTO ONLY */}
                  <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-md bg-slate-800 mb-2.5 relative">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-amber-400 text-xl bg-gradient-to-br from-slate-800 to-slate-950">
                        {member.fullName[0] || 'M'}
                      </div>
                    )}
                  </div>

                  {/* 2. NAME ONLY */}
                  <h3 className="text-xs sm:text-sm font-black text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                    {member.fullName}
                  </h3>

                  {/* 3. MEMBER ID ONLY */}
                  <div className="mt-2 w-full pt-1.5 border-t border-slate-800">
                    <span className="font-mono text-[10px] sm:text-xs font-black text-amber-400 tabular-nums">
                      {member.id}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
