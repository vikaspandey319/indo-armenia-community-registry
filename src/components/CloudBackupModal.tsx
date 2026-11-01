import React, { useState, useEffect } from 'react';
import { Member, EncryptedBackupPayload } from '../types/member';
import {
  downloadEncryptedBackup,
  restoreEncryptedBackup,
  exportMembersToCsv,
  getBackupHistory,
  BackupHistoryItem,
} from '../services/storage';
import {
  Shield,
  Lock,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  History,
  Key,
  Database,
} from 'lucide-react';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onMembersRestored: (newMembers: Member[]) => void;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  members,
  onMembersRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'restore' | 'history'>('export');
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPayload, setUploadedPayload] = useState<EncryptedBackupPayload | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [history, setHistory] = useState<BackupHistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getBackupHistory());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Export Backup
  const handleExportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassphrase || exportPassphrase.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'Passphrase must be at least 6 characters for 256-bit AES encryption security.',
      });
      return;
    }
    if (exportPassphrase !== confirmPassphrase) {
      setStatusMessage({
        type: 'error',
        text: 'Passphrases do not match. Please re-type your confirmation passphrase.',
      });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);
      const payload = await downloadEncryptedBackup(exportPassphrase);
      setHistory(getBackupHistory());
      setStatusMessage({
        type: 'success',
        text: `Successfully encrypted and downloaded ${payload.recordCount} member records with AES-GCM 256. SHA-256 Checksum: ${payload.checksum.slice(
          0,
          16
        )}...`,
      });
      setExportPassphrase('');
      setConfirmPassphrase('');
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to create encrypted backup archive. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle File Selection for Restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const payload: EncryptedBackupPayload = JSON.parse(text);
        if (!payload.encryptedData || !payload.iv || !payload.salt) {
          throw new Error('Invalid backup file schema');
        }
        setUploadedPayload(payload);
        setStatusMessage({
          type: 'info',
          text: `Loaded archive from ${new Date(
            payload.exportedAt
          ).toLocaleString()} containing ${payload.recordCount} records. Enter passphrase to decrypt and restore.`,
        });
      } catch (err) {
        setUploadedPayload(null);
        setStatusMessage({
          type: 'error',
          text: 'Selected file is not a valid encrypted Indo-Armenia LLC backup archive.',
        });
      }
    };
    reader.readAsText(file);
  };

  // Handle Restore Backup
  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedPayload) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a valid .enc.json backup file first.',
      });
      return;
    }
    if (!restorePassphrase) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter the encryption passphrase used when creating this backup.',
      });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);
      const result = await restoreEncryptedBackup(uploadedPayload, restorePassphrase);

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `Backup restored successfully! ${result.count} verified member records have been synchronized to the registry.`,
        });
        setRestorePassphrase('');
        setUploadedFile(null);
        setUploadedPayload(null);
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Decryption failed. Please check your passphrase.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to restore backup archive.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCsv = () => {
    exportMembersToCsv(members);
    setStatusMessage({
      type: 'success',
      text: `Exported ${members.length} members to CSV format.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Secure Cloud Backup & Encryption Center
              </h3>
              <p className="text-xs text-slate-400">
                AES-GCM 256-Bit Military Grade Protection · Indo-Armenia LLC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('export');
              setStatusMessage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Create Cloud Backup</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('restore');
              setStatusMessage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'restore'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore & Decrypt</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setStatusMessage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Snapshot Log</span>
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            ) : (
              <Lock className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{statusMessage.text}</div>
          </div>
        )}

        {/* Tab 1: Export Backup */}
        {activeTab === 'export' && (
          <form onSubmit={handleExportBackup} className="p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Zero-Knowledge Client-Side Encryption</span>
              </div>
              <p className="text-amber-800/90 leading-relaxed">
                Your database ({members.length} members) will be encrypted in your browser using{' '}
                <strong>AES-256-GCM</strong> with 100,000 PBKDF2 hashing rounds. Only someone with your secret
                passphrase can decrypt the data.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Backup Encryption Passphrase *
              </label>
              <input
                type="password"
                value={exportPassphrase}
                onChange={(e) => setExportPassphrase(e.target.value)}
                placeholder="At least 6 characters..."
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Passphrase *
              </label>
              <input
                type="password"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Re-enter the exact same passphrase"
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isProcessing ? 'Encrypting & Packaging...' : 'Download Encrypted Backup (.enc.json)'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full sm:w-auto py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Restore Backup */}
        {activeTab === 'restore' && (
          <form onSubmit={handleRestoreBackup} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Encrypted Backup File (.enc.json)
              </label>
              <input
                type="file"
                accept=".json,.enc.json"
                onChange={handleFileSelect}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
              />
            </div>

            {uploadedPayload && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-800">
                  Target: {uploadedPayload.organization}
                </div>
                <div className="text-slate-600">
                  Exported: {new Date(uploadedPayload.exportedAt).toLocaleString()}
                </div>
                <div className="text-slate-600 font-mono tabular-nums">
                  Records: {uploadedPayload.recordCount} members
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Decryption Passphrase *
              </label>
              <input
                type="password"
                value={restorePassphrase}
                onChange={(e) => setRestorePassphrase(e.target.value)}
                placeholder="Passphrase used during backup creation"
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing || !uploadedPayload}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isProcessing ? 'Verifying & Restoring...' : 'Verify, Decrypt & Sync Database'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Snapshot History */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4">
            <div className="text-xs text-slate-500">
              Audit log of recent encrypted cloud backups created on this workstation:
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No local backup snapshots logged yet. Use the "Create Cloud Backup" tab to generate one.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {history.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 font-mono">
                        {item.id}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-700 tabular-nums">
                        {item.recordCount} records
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SHA: {item.checksum}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            Active Registry: {members.length} Members
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
