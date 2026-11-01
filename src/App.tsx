/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppLanguage, Member, TextScale } from './types/member';
import {
  subscribeToMemberUpdates,
  syncMembersWithServer,
} from './services/storage';
import { auth } from './services/firebase';
import { signOut } from 'firebase/auth';
import { Header, AppTab } from './components/Header';
import { RegistrationForm } from './components/RegistrationForm';
import { MembersDirectory } from './components/MembersDirectory';
import { AdminPortal } from './components/AdminPortal';
import { AdminPasscodeModal } from './components/AdminPasscodeModal';
import { CrestLogo } from './components/CrestLogo';
import { ShieldCheck, CheckCircle2, MapPin, Lock, Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from './hooks/usePWAInstall';
import { InstallAppModal } from './components/InstallAppModal';
import { SosEmergencyModal } from './components/SosEmergencyModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('register');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [textScale, setTextScale] = useState<TextScale>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);

  // PWA install management
  const { isInstallable, isInstalled, isIOS, isAndroid, isStandalone, install } = usePWAInstall();

  const [newSubmissionToast, setNewSubmissionToast] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Load only records returned by the server after it verifies the member session.
  useEffect(() => {
    // Never render cached personal records before the server verifies member access.
    localStorage.removeItem('indo_armenia_members_v1');
    setMembers([]);

    // Fetch records through the authorized server API.
    syncMembersWithServer().then((fresh) => {
      setMembers(fresh);
    });

    // Keep updates synchronized between tabs on this device.
    const unsubscribe = subscribeToMemberUpdates((event) => {
      setMembers(event.all);
      if (event.type === 'created' && event.member) {
        setNewSubmissionToast({
          id: event.member.id,
          name: event.member.fullName,
        });
        setTimeout(() => {
          setNewSubmissionToast(null);
        }, 6000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    const fresh = await syncMembersWithServer();
    setMembers(fresh);
  }, []);

  const handleMembersUpdated = useCallback((updatedList: Member[]) => {
    setMembers(updatedList);
  }, []);

  const handleRegistrationSuccess = useCallback(async (newMember: Member) => {
    const fresh = await syncMembersWithServer();
    setMembers(fresh);
  }, []);

  // Handle tab changes through Firebase administrator authentication.
  const handleTabChange = (tab: AppTab) => {
    if (tab === 'admin') {
      if (!isAdminUnlocked) {
        setIsAdminModalOpen(true);
        return;
      }
    }
    setCurrentTab(tab);
  };

  const handleAdminPasscodeSuccess = () => {
    setIsAdminUnlocked(true);
    setIsAdminModalOpen(false);
    setCurrentTab('admin');
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    signOut(auth).catch(() => {});
    setCurrentTab('members');
  };

  // Compute text scale class
  const getTextScaleClass = () => {
    switch (textScale) {
      case 'large':
        return 'text-[1.125rem] leading-relaxed';
      case 'xlarge':
        return 'text-[1.25rem] leading-loose';
      default:
        return '';
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors ${
        highContrast ? 'contrast-125 saturate-125' : ''
      } ${getTextScaleClass()}`}
    >
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        language={language}
        onLanguageChange={setLanguage}
        textScale={textScale}
        onTextScaleChange={setTextScale}
        highContrast={highContrast}
        onHighContrastToggle={() => setHighContrast(!highContrast)}
        memberCount={members.length}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenSosModal={() => setIsSosModalOpen(true)}
      />

      {/* Real-time Submission Toast */}
      {newSubmissionToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-500/60 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-amber-400">
              New Member Registration Received
            </div>
            <div className="text-sm font-extrabold">{newSubmissionToast.name}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ID: {newSubmissionToast.id}
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentTab('members');
              setNewSubmissionToast(null);
            }}
            className="text-xs text-amber-300 hover:text-amber-200 underline font-bold self-center cursor-pointer"
          >
            View
          </button>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1">
        {currentTab === 'register' && (
          <RegistrationForm
            language={language}
            onSuccess={handleRegistrationSuccess}
            existingMemberIds={members.map((m) => m.id)}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            onViewMembers={() => setCurrentTab('members')}
          />
        )}

        {currentTab === 'members' && (
          <div className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-blue-950/20 via-slate-900/10 to-indigo-950/30 py-2 sm:py-4">
            <MembersDirectory
              members={members}
              onRegisterClick={() => setCurrentTab('register')}
              onHomeClick={() => setCurrentTab('register')}
              isAdmin={isAdminUnlocked}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {currentTab === 'admin' && (
          <div className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-[#2d1406]/35 via-slate-900/10 to-slate-950/30 pb-10">
            {/* Admin Lock Bar with Brown Theme (User request: Admin brown background) */}
            <div className="bg-gradient-to-r from-[#451a03] via-[#5c2c16] to-[#451a03] border-b border-[#78350f] py-2 px-4 text-xs flex items-center justify-between max-w-7xl mx-auto shadow-sm text-amber-100">
              <span className="font-bold text-amber-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Session Active (Passcode Protected)</span>
              </span>
              <button
                onClick={handleLockAdmin}
                className="font-bold text-amber-300 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Lock Admin Portal
              </button>
            </div>

            <AdminPortal
              members={members}
              language={language}
              onRefresh={handleRefresh}
              onMembersUpdated={handleMembersUpdated}
              latestSubmissionsCount={members.length}
            />
          </div>
        )}
      </main>

      {/* Compact Bottom Information */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-2.5 px-3 text-[10px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-bold text-amber-400">Indo Armenia LLC</span>
            <span>·</span>
            <span>Maro Margaryan 14, Yerevan, Armenia</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              <span>Encrypted Backups</span>
            </span>
            <span>·</span>
            <button
              onClick={() => handleTabChange('members')}
              className="text-amber-400 hover:underline font-semibold"
            >
              Members
            </button>
            <span>·</span>
            <button
              onClick={() => handleTabChange('admin')}
              className="text-amber-400 hover:underline font-semibold"
            >
              Admin
            </button>
            <span>·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      {/* Administrator sign-in gate */}
      <AdminPasscodeModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminPasscodeSuccess}
      />

      {/* User requested: Install app modal (only opened when clicking INSTALL button) */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => {
          sessionStorage.setItem('dismissed_install_link_popup', 'true');
          setIsInstallModalOpen(false);
        }}
        onInstall={install}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstalled={isInstalled || isStandalone}
      />

      {/* Emergency Community SOS Modal */}
      <SosEmergencyModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
      />

      {/* Real-Time Live Registration Toast Notification */}
      {newSubmissionToast && (
        <div className="fixed top-20 right-4 z-50 animate-bounce duration-500 max-w-sm w-full bg-slate-900/95 border-2 border-amber-400 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>New Registration Received</span>
              </div>
              <div className="text-xs font-black text-white truncate">
                {newSubmissionToast.name}
              </div>
              <div className="text-[10px] font-mono text-amber-400">
                {newSubmissionToast.id}
              </div>
            </div>
          </div>
          <button
            onClick={() => setNewSubmissionToast(null)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg text-xs cursor-pointer hover:bg-slate-800 transition-colors shrink-0"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
