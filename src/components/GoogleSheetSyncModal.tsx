import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Database,
  Code2,
  Sparkles,
} from 'lucide-react';
import { Member } from '../types/member';
import { apiFetch, exportMembersToCsv, getLocalSheetsConfig, saveLocalSheetsConfig } from '../services/storage';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  members,
}) => {
  const [config, setConfig] = useState<{
    webhookUrl: string;
    sheetUrl: string;
    autoSync: boolean;
    lastSyncedAt?: string;
  }>(getLocalSheetsConfig());

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'csv' | 'webhook'>('csv');

  useEffect(() => {
    // Fetch server configuration if available
    apiFetch('/api/google-sheets/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) {
          setConfig((prev) => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const appsScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
    if (data.members) {
    sheet.clear();
    var headers = ["Member ID", "Full Name", "Home Country", "WhatsApp Country Code", "WhatsApp Number", "Arrival Date in Armenia", "Agency / Agent Name", "Status", "Registered At"];
    sheet.appendRow(headers);
    data.members.forEach(function(m) {
      sheet.appendRow([m.id, m.fullName, m.country, m.whatsappCountryCode, m.whatsappNumber, m.arrivalDateInArmenia, m.agentOrAgencyName, m.verificationStatus, m.registeredAt]);
    });
  }
  return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveAndSync = async () => {
    setIsSyncing(true);
    setSyncStatusMessage(null);

    const now = new Date().toISOString();
    const updated = {
      ...config,
      lastSyncedAt: now,
    };
    setConfig(updated);
    saveLocalSheetsConfig(updated);

    try {
      const saved = await apiFetch('/api/google-sheets/config', {
        method: 'POST',
        body: JSON.stringify({
          webhookUrl: config.webhookUrl,
          sheetUrl: config.sheetUrl,
          autoSync: config.autoSync,
        }),
      });
      if (!saved.ok) throw new Error('Could not save Google Sheets settings.');
      const res = await apiFetch('/api/google-sheets/sync', {
        method: 'POST',
        body: JSON.stringify({
          webhookUrl: config.webhookUrl,
          sheetUrl: config.sheetUrl,
          autoSync: config.autoSync,
        }),
      });

      if (res.ok) {
        setSyncStatusMessage(`Successfully linked & synced ${members.length} members with Google Sheet!`);
      } else {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.error || 'Google Sheets sync failed.');
      }
    } catch (e) {
      setSyncStatusMessage(e instanceof Error ? e.message : 'Google Sheets sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl max-w-xl w-full text-white shadow-2xl overflow-hidden shadow-emerald-950/40 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-black shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide uppercase text-white leading-none">
                Link Data with Google Sheets
              </h3>
              <p className="text-[11px] text-emerald-100 font-semibold mt-0.5">
                CSV export or server-side Google Sheets sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Method Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('csv')}
              className={`py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'csv'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('webhook')}
              className={`py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'webhook'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Method 2: Webhook / Script</span>
            </button>
          </div>

          {activeTab === 'csv' ? (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1.5">
                <div className="font-black text-white flex items-center gap-1.5 text-sm">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Admin-protected member export</span>
                </div>
                <p className="text-slate-300">
                  Export the current member list as a CSV and import it into Google Sheets. The endpoint requires an administrator session, so public spreadsheet formulas cannot access it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportMembersToCsv(members)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Download member CSV
              </button>
              <a href="https://sheets.new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> Open Google Sheets
              </a>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Google Sheets Webhook URL (Apps Script Exec URL)
                </label>
                <input
                  type="url"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Google Sheet View URL (Optional, for quick opening)
                </label>
                <input
                  type="url"
                  value={config.sheetUrl}
                  onChange={(e) => setConfig({ ...config, sheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={config.autoSync}
                  onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                />
                <label htmlFor="autoSync" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Sync the sheet after each new member registers
                </label>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Google Apps Script Code (Extensions → Apps Script)
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded-xl font-mono overflow-x-auto max-h-24">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}

          {/* Sync status & results */}
          {syncStatusMessage && (
            <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncStatusMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleSaveAndSync}
              disabled={isSyncing}
              className="w-full sm:flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'SYNCING TO GOOGLE SHEET...' : `SYNC ALL (${members.length}) MEMBERS NOW`}</span>
            </button>

            {config.sheetUrl && (
              <a
                href={config.sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
