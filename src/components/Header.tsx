import React from 'react';
import { AppLanguage, TextScale } from '../types/member';
import { CrestLogo } from './CrestLogo';
import { Globe, UserPlus, Users, Download, AlertTriangle } from 'lucide-react';

export type AppTab = 'register' | 'members' | 'admin';

interface HeaderProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  textScale: TextScale;
  onTextScaleChange: (scale: TextScale) => void;
  highContrast: boolean;
  onHighContrastToggle: () => void;
  memberCount: number;
  onOpenInstallModal: () => void;
  onOpenSosModal: () => void;
}

/**
 * Header Component
 * User Request: register members admin install sos all buttons keep in one line only
 */
export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  language,
  onLanguageChange,
  memberCount,
  onOpenInstallModal,
  onOpenSosModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-amber-500/30 shadow-lg backdrop-blur-md">
      {/* Micro national ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-300 via-emerald-600 via-red-600 via-blue-600 to-amber-500" />

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-16">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onTabChange('register')}
            className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer group"
          >
            <CrestLogo size={36} />
            <div className="flex flex-col">
              <span className="font-black text-amber-400 tracking-wide text-xs sm:text-lg uppercase leading-none font-sans group-hover:text-amber-300 transition-colors">
                Indo Armenia LLC
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] sm:text-[9px] text-sky-200 tracking-wider uppercase font-bold">
                  Global Partnership
                </span>
                <span className="text-slate-600 text-[8px] hidden lg:inline">·</span>
                <span className="text-[8px] text-amber-200/90 font-medium hidden lg:inline">
                  Maro Margaryan 14, Yerevan
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Single-Line Navigation: Register, Members, Admin, Install, SOS */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {/* 1. Register */}
            <button
              onClick={() => onTabChange('register')}
              className={`flex items-center gap-1.5 text-xs lg:text-sm font-bold transition-all whitespace-nowrap px-3 py-1.5 rounded-xl cursor-pointer ${
                currentTab === 'register'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black ring-2 ring-amber-300'
                  : 'bg-amber-950/50 text-amber-200 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Register</span>
            </button>

            {/* 2. Members (User request: Give members tab blue background) */}
            <button
              onClick={() => onTabChange('members')}
              className={`flex items-center gap-1.5 text-xs lg:text-sm font-bold transition-all whitespace-nowrap px-3.5 py-1.5 rounded-xl cursor-pointer ${
                currentTab === 'members'
                  ? 'bg-blue-600 text-white shadow-lg font-black ring-2 ring-blue-300'
                  : 'bg-blue-700 text-white border border-blue-400 hover:bg-blue-500 hover:text-white shadow-xs font-bold'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0 text-white" />
              <span>Members</span>
            </button>

            {/* 3. Admin (User request: Give Admin brown background) */}
            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-1.5 text-xs lg:text-sm font-bold transition-all whitespace-nowrap px-3.5 py-1.5 rounded-xl cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-gradient-to-r from-[#8B4513] via-[#78350F] to-[#5C2C16] text-white shadow-lg font-black ring-2 ring-amber-400 border border-[#A0522D]'
                  : 'bg-[#5C2C16] text-amber-100 border border-[#8B4513] hover:bg-[#78350F] hover:text-white shadow-xs font-bold'
              }`}
            >
              <span>Admin</span>
            </button>

            {/* 4. Install */}
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 text-xs lg:text-sm font-black transition-all whitespace-nowrap px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md hover:shadow-emerald-500/20 active:scale-95 cursor-pointer border border-emerald-300"
              title="Install App on Device"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>INSTALL</span>
            </button>

            {/* 5. SOS */}
            <button
              onClick={onOpenSosModal}
              className="flex items-center gap-1.5 text-xs lg:text-sm font-black transition-all whitespace-nowrap px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer border border-red-400 animate-pulse"
              title="Emergency SOS Help Alert"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span>SOS</span>
            </button>
          </nav>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700 shrink-0">
            <Globe className="w-3.5 h-3.5 text-amber-400 ml-1 mr-0.5" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
              className="bg-transparent text-[11px] font-bold text-white focus:outline-none cursor-pointer pr-1 py-0.5"
              aria-label="Select Language"
            >
              <option value="en" className="bg-slate-900 text-white">EN</option>
              <option value="hi" className="bg-slate-900 text-white">HI · हिन्दी</option>
              <option value="hy" className="bg-slate-900 text-white">HY · Հայ</option>
              <option value="ru" className="bg-slate-900 text-white">RU · Рус</option>
            </select>
          </div>
        </div>

        {/* Mobile Navigation bar: Register, Members, Admin, Install, SOS kept in ONE line only */}
        <div className="md:hidden py-1.5 border-t border-slate-800/80">
          <div className="grid grid-cols-5 gap-1 items-center">
            {/* 1. Register */}
            <button
              onClick={() => onTabChange('register')}
              className={`font-bold py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 text-[11px] cursor-pointer transition-all ${
                currentTab === 'register'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs ring-1 ring-amber-300'
                  : 'bg-amber-950/60 text-amber-200 border border-amber-500/30 hover:bg-amber-900/80'
              }`}
            >
              <UserPlus className="w-3 h-3 shrink-0" />
              <span className="truncate">Register</span>
            </button>

            {/* 2. Members (User request: Give members tab blue background) */}
            <button
              onClick={() => onTabChange('members')}
              className={`font-bold py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 text-[11px] cursor-pointer transition-all ${
                currentTab === 'members'
                  ? 'bg-blue-600 text-white font-black shadow-xs ring-1 ring-blue-300'
                  : 'bg-blue-700 text-white border border-blue-400 hover:bg-blue-600'
              }`}
            >
              <Users className="w-3 h-3 shrink-0 text-white" />
              <span className="truncate">Members</span>
            </button>

            {/* 3. Admin (User request: Give Admin brown background) */}
            <button
              onClick={() => onTabChange('admin')}
              className={`font-bold py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 text-[11px] cursor-pointer transition-all ${
                currentTab === 'admin'
                  ? 'bg-[#78350F] text-white font-black shadow-xs ring-1 ring-amber-400 border border-[#A0522D]'
                  : 'bg-[#5C2C16] text-amber-100 border border-[#8B4513] hover:bg-[#78350F]'
              }`}
            >
              <span className="truncate">Admin</span>
            </button>

            {/* 4. Install */}
            <button
              onClick={onOpenInstallModal}
              className="font-black py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 text-[11px] bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-xs cursor-pointer border border-emerald-300 active:scale-95 transition-transform"
              title="Install App"
            >
              <Download className="w-3 h-3 shrink-0" />
              <span className="truncate uppercase font-black">Install</span>
            </button>

            {/* 5. SOS */}
            <button
              onClick={onOpenSosModal}
              className="font-black py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 text-[11px] bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs cursor-pointer border border-red-400 animate-pulse active:scale-95 transition-transform"
              title="Emergency SOS Help"
            >
              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-300" />
              <span className="truncate uppercase font-black">SOS</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
