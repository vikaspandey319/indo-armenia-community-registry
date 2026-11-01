import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();
      const response = await fetch('/api/admin/session', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) {
        await signOut(auth);
        throw new Error('This account is not authorized for the administrator portal.');
      }
      setErrorMessage('');
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        setPassword('');
        setIsSuccess(false);
      }, 500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sign in failed. Check your credentials.');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 sm:p-7 relative text-center space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shadow-xs mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Administrator Access
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sign in with the authorized administrator account.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Passcode verified. Unlocking...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Administrator email"
              autoComplete="username"
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-300 focus:border-amber-500 text-slate-900 text-center font-mono text-base font-bold tracking-widest focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-amber-500 text-slate-900 text-center font-mono text-base font-bold focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="pt-2 text-[10px] text-slate-400 font-mono">
          Firebase Authentication · Admin email allowlist
        </div>
      </div>
    </div>
  );
};
