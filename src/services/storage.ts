/**
 * Storage & Real-Time Sync Service for Indo-Armenia LLC Registry
 * Features:
 * - Persistent local storage & seed initialization
 * - Real-time cross-tab synchronization via BroadcastChannel
 * - Backend /api/members synchronization fallback
 * - Event subscriber for live Admin monitoring
 * - Encrypted cloud backup integration
 */

import { EncryptedBackupPayload, Member, VerificationStatus } from '../types/member';
import { decryptMembersBackup, encryptMembersBackup } from '../utils/crypto';
import { auth } from './firebase';

const STORAGE_KEY = 'indo_armenia_members_v1';
const BACKUP_HISTORY_KEY = 'indo_armenia_backup_history_v1';
const CHANNEL_NAME = 'indo_armenia_sync_channel';

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const user = auth.currentUser;
  if (user) headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}

// Cross-tab real-time communication
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported in this environment', e);
  }
}

type SyncCallback = (event: { type: 'created' | 'updated' | 'deleted' | 'restored'; member?: Member; all: Member[] }) => void;
const subscribers = new Set<SyncCallback>();

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data && event.data.all) {
      subscribers.forEach((cb) => cb(event.data));
    }
  };
}

export function subscribeToMemberUpdates(callback: SyncCallback): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function notifySubscribers(type: 'created' | 'updated' | 'deleted' | 'restored', member?: Member, all: Member[] = []) {
  const payload = { type, member, all };
  subscribers.forEach((cb) => cb(payload));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Load all registered members from storage
 */
export function getStoredMembers(): Member[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading members from localStorage', e);
    return [];
  }
}

/**
 * Full Real-Time Sync with Server
 * Fetches latest members from /api/members, merges any offline/local registrations,
 * updates localStorage, and notifies all subscribers in real time.
 */
export async function syncMembersWithServer(): Promise<Member[]> {
  if (typeof window === 'undefined') return [];

  try {
    const res = await apiFetch('/api/members');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        const serverMembers: Member[] = json.data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverMembers));
        notifySubscribers('restored', undefined, serverMembers);
        return serverMembers;
      }
    }
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('indo_armenia_registered_member_id');
      return [];
    }
  } catch (err) {
    console.warn('Member service unavailable:', err);
  }

  return getStoredMembers();
}

export async function registerNewMember(
  data: Omit<Member, 'id' | 'registeredAt' | 'updatedAt' | 'verificationStatus' | 'checksum'>
): Promise<Member> {
  const response = await apiFetch('/api/members', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error(result.error || 'Registration could not be saved.');
  const member = result.data as Member;
  localStorage.setItem('indo_armenia_registered_member_id', member.id);
  await syncMembersWithServer();
  notifySubscribers('created', member, getStoredMembers());
  return member;
}

/**
 * Update member verification status or notes
 */
export async function updateMemberStatus(
  id: string,
  verificationStatus: VerificationStatus,
  notes?: string
): Promise<Member[]> {
  const current = getStoredMembers();
  const response = await apiFetch(`/api/members/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ verificationStatus, notes }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Member update failed.');
  const updated = current.map((member) => member.id === id ? result.data as Member : member);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers('updated', result.data as Member, updated);
  return updated;
}

/**
 * Delete member record (Admin only)
 */
export async function deleteMember(id: string): Promise<Member[]> {
  const current = getStoredMembers();
  const response = await apiFetch(`/api/members/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Member deletion failed.');
  const updated = current.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers('deleted', undefined, updated);
  return updated;
}

/**
 * Export members as RFC 4180 CSV with UTF-8 BOM
 */
export function exportMembersToCsv(members: Member[]): void {
  const headers = [
    'Member ID',
    'Full Name',
    'Home Country',
    'WhatsApp Country Code',
    'WhatsApp Number',
    'Full WhatsApp Link',
    'Arrival Date in Armenia',
    'Agency / Agent Name (home country)',
    'Status',
    'Registered Date',
    'Integrity Checksum',
  ];

  const escapeCsv = (val: string | undefined) => {
    if (val === undefined || val === null) return '""';
    const clean = String(val).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = members.map((m) => [
    escapeCsv(m.id),
    escapeCsv(m.fullName),
    escapeCsv(m.country),
    escapeCsv(m.whatsappCountryCode),
    escapeCsv(m.whatsappNumber),
    escapeCsv(`https://wa.me/${m.whatsappCountryCode.replace('+', '')}${m.whatsappNumber}`),
    escapeCsv(m.arrivalDateInArmenia),
    escapeCsv(m.agentOrAgencyName),
    escapeCsv(m.verificationStatus),
    escapeCsv(m.registeredAt),
    escapeCsv(m.checksum || ''),
  ]);

  // Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel respects Armenian, Devanagari & accents
  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Indo-Armenia-LLC-Members-${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface BackupHistoryItem {
  id: string;
  timestamp: string;
  recordCount: number;
  checksum: string;
}

export function getBackupHistory(): BackupHistoryItem[] {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveBackupHistoryItem(item: BackupHistoryItem) {
  try {
    const list = getBackupHistory();
    const updated = [item, ...list].slice(0, 10);
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
}

/**
 * Generate and download encrypted AES-256 backup file
 */
export async function downloadEncryptedBackup(passphrase: string): Promise<EncryptedBackupPayload> {
  const members = getStoredMembers();
  const payload = await encryptMembersBackup(members, passphrase);

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Indo-Armenia-LLC-EncryptedBackup-${new Date().toISOString().slice(0, 10)}.enc.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  saveBackupHistoryItem({
    id: `BKP-${Date.now()}`,
    timestamp: payload.exportedAt,
    recordCount: payload.recordCount,
    checksum: payload.checksum.slice(0, 16),
  });

  return payload;
}

/**
 * Restore members from decrypted payload
 */
export async function restoreEncryptedBackup(
  payload: EncryptedBackupPayload,
  passphrase: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const result = await decryptMembersBackup(payload, passphrase);
  if (!result.success || !result.members) {
    return { success: false, error: result.error || 'Decryption failed' };
  }

  try {
    const response = await apiFetch('/api/members/restore', {
      method: 'POST',
      body: JSON.stringify({ members: result.members }),
    });
    const apiResult = await response.json();
    if (!response.ok) return { success: false, error: apiResult.error || 'Backup could not be restored to the database.' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Backup restore failed.' };
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(result.members));
  notifySubscribers('restored', undefined, result.members);

  return { success: true, count: result.members.length };
}

// SOS Emergency Alert Management
const SOS_STORAGE_KEY = 'indo_armenia_sos_v1';
const SOS_CHANNEL_NAME = 'indo_armenia_sos_channel';

let sosBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    sosBroadcastChannel = new BroadcastChannel(SOS_CHANNEL_NAME);
  } catch (e) {
    // ignore
  }
}

type SosCallback = (alert: any) => void;
const sosSubscribers = new Set<SosCallback>();

if (sosBroadcastChannel) {
  sosBroadcastChannel.onmessage = (event) => {
    if (event.data) {
      sosSubscribers.forEach((cb) => cb(event.data));
    }
  };
}

export function subscribeToSosAlerts(callback: SosCallback): () => void {
  sosSubscribers.add(callback);
  return () => {
    sosSubscribers.delete(callback);
  };
}

export async function dispatchSosAlert(payload: {
  memberName: string;
  phone: string;
  category?: string;
  message?: string;
  location?: string;
}): Promise<any> {
  const response = await apiFetch('/api/sos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error(result.error || 'SOS alert could not be sent.');
  const alert = result.data;
  const existing = getStoredSosAlerts();
  const updated = [alert, ...existing];
  localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(updated));
  sosBroadcastChannel?.postMessage({ type: 'sos_alert', alert });
  sosSubscribers.forEach((cb) => cb({ type: 'sos_alert', alert }));
  return alert;
}

export async function getSosAlerts(): Promise<any[]> {
  try {
    const response = await apiFetch('/api/sos');
    if (!response.ok) return [];
    const result = await response.json();
    const alerts = Array.isArray(result.data) ? result.data : [];
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(alerts));
    return alerts;
  } catch (_) { return []; }
}

function getStoredSosAlerts(): any[] {
  try {
    const raw = localStorage.getItem(SOS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export async function resolveSosAlert(id: string, resolvedBy = 'Admin'): Promise<boolean> {
  const response = await apiFetch(`/api/sos/${encodeURIComponent(id)}/resolve`, { method: 'PATCH' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not resolve SOS alert.');
  const alerts = getStoredSosAlerts().map((alert: any) => alert.id === id ? result.data : alert);
  localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(alerts));

  const payload = { type: 'sos_resolved', id, resolvedBy: result.data.resolvedBy };
  if (sosBroadcastChannel) {
    try {
      sosBroadcastChannel.postMessage(payload);
    } catch (_) {}
  }
  sosSubscribers.forEach((cb) => cb(payload));

  return true;
}

// Google Sheets Config Storage
const SHEETS_CONFIG_STORAGE_KEY = 'indo_armenia_sheets_cfg_v1';

export function getLocalSheetsConfig(): { webhookUrl: string; sheetUrl: string; autoSync: boolean; lastSyncedAt?: string } {
  try {
    const raw = localStorage.getItem(SHEETS_CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { webhookUrl: '', sheetUrl: '', autoSync: false };
}

export function saveLocalSheetsConfig(cfg: any) {
  try {
    localStorage.setItem(SHEETS_CONFIG_STORAGE_KEY, JSON.stringify(cfg));
  } catch (_) {}
}
