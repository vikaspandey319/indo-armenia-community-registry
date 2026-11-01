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
import { initialSampleMembers } from '../utils/sampleData';
import {
  computeSha256,
  decryptMembersBackup,
  encryptMembersBackup,
  generateMemberId,
} from '../utils/crypto';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

const STORAGE_KEY = 'indo_armenia_members_v1';
const BACKUP_HISTORY_KEY = 'indo_armenia_backup_history_v1';
const CHANNEL_NAME = 'indo_armenia_sync_channel';

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
  if (typeof window === 'undefined') return initialSampleMembers;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSampleMembers));
      return initialSampleMembers;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialSampleMembers;
  } catch (e) {
    console.error('Error reading members from localStorage', e);
    return initialSampleMembers;
  }
}

/**
 * Full Real-Time Sync with Server
 * Fetches latest members from /api/members, merges any offline/local registrations,
 * updates localStorage, and notifies all subscribers in real time.
 */
export async function syncMembersWithServer(): Promise<Member[]> {
  if (typeof window === 'undefined') return initialSampleMembers;

  try {
    const res = await fetch('/api/members');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        const local = getStoredMembers();
        const serverMembers: Member[] = json.data;

        // Build merged map by id
        const mergedMap = new Map<string, Member>();
        serverMembers.forEach((m) => mergedMap.set(m.id, m));

        // Add any local members that server doesn't have yet (and push to server)
        local.forEach((m) => {
          if (!mergedMap.has(m.id)) {
            mergedMap.set(m.id, m);
            // Push missing local registration to backend
            fetch('/api/members', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(m),
            }).catch(() => {});
          }
        });

        const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
          const timeA = new Date(a.registeredAt || 0).getTime();
          const timeB = new Date(b.registeredAt || 0).getTime();
          return timeB - timeA;
        });

        const currentLocalRaw = localStorage.getItem(STORAGE_KEY);
        const currentLocalList: Member[] = currentLocalRaw ? JSON.parse(currentLocalRaw) : [];
        const hasDiff =
          currentLocalList.length !== mergedList.length ||
          currentLocalList[0]?.id !== mergedList[0]?.id;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
        if (hasDiff) {
          notifySubscribers('restored', undefined, mergedList);
        }
        return mergedList;
      }
    }
  } catch (err) {
    console.warn('Real-time server fetch offline fallback:', err);
  }

  return getStoredMembers();
}

// Real-Time Server-Sent Events (SSE) Client Connection
let sseConnection: EventSource | null = null;
let sseReconnectTimer: any = null;

export function initRealTimeEventsListener() {
  if (typeof window === 'undefined' || !('EventSource' in window)) return;
  if (sseConnection) return;

  try {
    sseConnection = new EventSource('/api/events');

    sseConnection.addEventListener('member_registered', (event: MessageEvent) => {
      try {
        const newMember: Member = JSON.parse(event.data);
        const current = getStoredMembers();
        const existingIdx = current.findIndex((m) => m.id === newMember.id);
        let updatedList: Member[];
        if (existingIdx >= 0) {
          updatedList = [...current];
          updatedList[existingIdx] = newMember;
        } else {
          updatedList = [newMember, ...current];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        notifySubscribers('created', newMember, updatedList);
      } catch (e) {
        console.error('Error handling member_registered SSE:', e);
      }
    });

    sseConnection.addEventListener('member_updated', (event: MessageEvent) => {
      try {
        const updatedMember: Member = JSON.parse(event.data);
        const current = getStoredMembers();
        const updatedList = current.map((m) => (m.id === updatedMember.id ? updatedMember : m));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        notifySubscribers('updated', updatedMember, updatedList);
      } catch (e) {
        console.error('Error handling member_updated SSE:', e);
      }
    });

    sseConnection.addEventListener('member_deleted', (event: MessageEvent) => {
      try {
        const { id } = JSON.parse(event.data);
        const current = getStoredMembers();
        const updatedList = current.filter((m) => m.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        notifySubscribers('deleted', undefined, updatedList);
      } catch (e) {
        console.error('Error handling member_deleted SSE:', e);
      }
    });

    sseConnection.addEventListener('sos_alert', (event: MessageEvent) => {
      try {
        const alert = JSON.parse(event.data);
        sosSubscribers.forEach((cb) => cb({ type: 'sos_alert', alert }));
      } catch (_) {}
    });

    sseConnection.addEventListener('sos_resolved', (event: MessageEvent) => {
      try {
        const alert = JSON.parse(event.data);
        sosSubscribers.forEach((cb) => cb({ type: 'sos_resolved', id: alert.id, resolvedBy: alert.resolvedBy }));
      } catch (_) {}
    });

    sseConnection.onerror = () => {
      if (sseConnection) {
        try {
          sseConnection.close();
        } catch (_) {}
        sseConnection = null;
      }
      clearTimeout(sseReconnectTimer);
      sseReconnectTimer = setTimeout(() => {
        initRealTimeEventsListener();
      }, 3000);
    };
  } catch (err) {
    console.warn('Could not establish SSE connection:', err);
  }
}

// -------------------------------------------------------------
// Cloud Firestore Real-Time Synchronizer (Mobile App <-> Web Portal)
// -------------------------------------------------------------
let firestoreMembersUnsub: (() => void) | null = null;
let firestoreSosUnsub: (() => void) | null = null;
let isSeedingFirestore = false;

async function seedFirestoreSampleMembers() {
  if (isSeedingFirestore || !db) return;
  isSeedingFirestore = true;
  try {
    const batch = writeBatch(db);
    initialSampleMembers.forEach((m) => {
      batch.set(doc(db, 'members', m.id), m);
    });
    await batch.commit();
    console.log('✅ Firestore populated with initial verified members roster');
  } catch (err) {
    console.warn('Firestore initial seeding fallback:', err);
  } finally {
    isSeedingFirestore = false;
  }
}

export function initFirestoreListeners() {
  if (typeof window === 'undefined' || !db) return;

  // 1. Members real-time sync via Firestore
  if (!firestoreMembersUnsub) {
    try {
      const membersRef = collection(db, 'members');
      firestoreMembersUnsub = onSnapshot(
        membersRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudMembers: Member[] = [];
            snapshot.forEach((snap) => {
              const item = snap.data() as Member;
              if (item && item.id && item.fullName) {
                cloudMembers.push(item);
              }
            });

            // Sort by registeredAt descending
            cloudMembers.sort((a, b) => {
              const timeA = new Date(a.registeredAt || 0).getTime();
              const timeB = new Date(b.registeredAt || 0).getTime();
              return timeB - timeA;
            });

            const currentLocalRaw = localStorage.getItem(STORAGE_KEY);
            const currentLocalList: Member[] = currentLocalRaw ? JSON.parse(currentLocalRaw) : [];

            // Detect new registrations in real time
            if (currentLocalList.length > 0 && cloudMembers.length > currentLocalList.length) {
              const newReg = cloudMembers.find((cm) => !currentLocalList.some((loc) => loc.id === cm.id));
              if (newReg) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudMembers));
                notifySubscribers('created', newReg, cloudMembers);
                return;
              }
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudMembers));
            notifySubscribers('restored', undefined, cloudMembers);
          } else {
            // Seed sample data into Firestore if empty
            seedFirestoreSampleMembers();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'members');
        }
      );
    } catch (e) {
      console.warn('Firestore onSnapshot listener initialization warning:', e);
    }
  }

  // 2. Emergency SOS Alerts real-time sync via Firestore
  if (!firestoreSosUnsub) {
    try {
      const sosRef = collection(db, 'sos');
      firestoreSosUnsub = onSnapshot(
        sosRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const alerts: any[] = [];
            snapshot.forEach((snap) => {
              alerts.push(snap.data());
            });

            alerts.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
            localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(alerts));

            // Notify subscribers for any active alert
            const activeAlert = alerts.find((a) => a.status === 'active');
            if (activeAlert) {
              sosSubscribers.forEach((cb) => cb({ type: 'sos_alert', alert: activeAlert }));
            }
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'sos');
        }
      );
    } catch (e) {
      console.warn('Firestore SOS listener initialization warning:', e);
    }
  }
}

// Automatically start Firestore, SSE and periodic sync on browser/mobile load
if (typeof window !== 'undefined') {
  initFirestoreListeners();
  initRealTimeEventsListener();

  // Background active sync every 3.5 seconds for multi-layer cross-device synchronization
  setInterval(() => {
    syncMembersWithServer().catch(() => {});
  }, 3500);

  // Sync immediately when tab regains focus or visibility
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncMembersWithServer().catch(() => {});
    }
  });

  window.addEventListener('focus', () => {
    syncMembersWithServer().catch(() => {});
  });
}

/**
 * Save new member to database and sync to Firestore & server in real time
 */
export async function registerNewMember(
  data: Omit<Member, 'id' | 'registeredAt' | 'updatedAt' | 'verificationStatus' | 'checksum'>
): Promise<Member> {
  const currentMembers = getStoredMembers();
  const existingIds = currentMembers.map((m) => m.id);
  const newId = generateMemberId(existingIds);
  const now = new Date().toISOString();

  // Create member object
  const memberToSave: Member = {
    ...data,
    id: newId,
    verificationStatus: 'approved', // Auto-approved for fast digital card issuance
    registeredAt: now,
    updatedAt: now,
  };

  // Compute integrity checksum
  memberToSave.checksum = await computeSha256(
    `${memberToSave.id}:${memberToSave.fullName}:${memberToSave.whatsappNumber}:${memberToSave.registeredAt}`
  );

  const updatedList = [memberToSave, ...currentMembers];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

  // 1. Immediate write directly to Cloud Firestore (Real-time sync to all portals and devices)
  try {
    if (db) {
      await setDoc(doc(db, 'members', memberToSave.id), memberToSave);
      console.log(`🔥 [FIRESTORE SYNC] Member saved to Firestore: ${memberToSave.fullName} (${memberToSave.id})`);
    }
  } catch (fireErr) {
    handleFirestoreError(fireErr, OperationType.WRITE, `members/${memberToSave.id}`);
  }

  // 2. Secondary server-side sync & BroadcastChannel backup
  try {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberToSave),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.all && Array.isArray(json.all)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(json.all));
        notifySubscribers('created', memberToSave, json.all);
        return memberToSave;
      }
    }
  } catch (err) {
    console.warn('Real-time server registration post offline fallback:', err);
  }

  notifySubscribers('created', memberToSave, updatedList);
  return memberToSave;
}

/**
 * Update member verification status or notes
 */
export function updateMemberStatus(
  id: string,
  verificationStatus: VerificationStatus,
  notes?: string
): Member[] {
  const current = getStoredMembers();
  const updated = current.map((m) => {
    if (m.id === id) {
      return {
        ...m,
        verificationStatus,
        notes: notes !== undefined ? notes : m.notes,
        updatedAt: new Date().toISOString(),
      };
    }
    return m;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  const changed = updated.find((m) => m.id === id);
  notifySubscribers('updated', changed, updated);

  // Sync update to Cloud Firestore
  try {
    if (db) {
      updateDoc(doc(db, 'members', id), {
        verificationStatus,
        notes: notes !== undefined ? notes : '',
        updatedAt: new Date().toISOString(),
      }).catch((e) => handleFirestoreError(e, OperationType.UPDATE, `members/${id}`));
    }
  } catch (_) {}

  // Sync update to server
  try {
    fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationStatus, notes }),
    }).catch(() => {});
  } catch (_) {}

  return updated;
}

/**
 * Delete member record (Admin only)
 */
export function deleteMember(id: string): Member[] {
  const current = getStoredMembers();
  const updated = current.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers('deleted', undefined, updated);

  // Sync delete to Cloud Firestore
  try {
    if (db) {
      deleteDoc(doc(db, 'members', id)).catch((e) => handleFirestoreError(e, OperationType.DELETE, `members/${id}`));
    }
  } catch (_) {}

  // Sync deletion to server
  try {
    fetch(`/api/members/${id}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch (_) {}

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
  const newAlert = {
    id: `SOS-${Date.now().toString(36).toUpperCase()}`,
    memberName: payload.memberName || 'Community Member',
    phone: payload.phone || 'Emergency Helpline',
    category: payload.category || 'general',
    message: payload.message || 'Urgent assistance requested via Community SOS Help button',
    location: payload.location || 'Yerevan, Armenia',
    timestamp: new Date().toISOString(),
    status: 'active',
  };

  // 1. Direct Cloud Firestore write for instant real-time cloud dispatch
  try {
    if (db) {
      await setDoc(doc(db, 'sos', newAlert.id), newAlert);
      console.log(`🔥 [FIRESTORE SOS] Emergency alert written to cloud: ${newAlert.id}`);
    }
  } catch (fireErr) {
    handleFirestoreError(fireErr, OperationType.WRITE, `sos/${newAlert.id}`);
  }

  // 2. Local storage fallback
  try {
    const raw = localStorage.getItem(SOS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [newAlert, ...existing];
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  // 3. Broadcast cross-tab
  if (sosBroadcastChannel) {
    try {
      sosBroadcastChannel.postMessage({ type: 'sos_alert', alert: newAlert });
    } catch (_) {}
  }
  sosSubscribers.forEach((cb) => cb({ type: 'sos_alert', alert: newAlert }));

  // 4. Post to backend server
  try {
    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAlert),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn('Backend SOS dispatch offline fallback active:', e);
  }

  return newAlert;
}

export async function getSosAlerts(): Promise<any[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'sos'));
      if (!snap.empty) {
        const list: any[] = [];
        snap.forEach((d) => list.push(d.data()));
        list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (_) {}

  try {
    const res = await fetch('/api/sos');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) return json.data;
    }
  } catch (_) {}

  try {
    const raw = localStorage.getItem(SOS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}

  return [];
}

export async function resolveSosAlert(id: string, resolvedBy = 'Admin'): Promise<boolean> {
  // Update Cloud Firestore
  try {
    if (db) {
      updateDoc(doc(db, 'sos', id), {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy,
      }).catch((e) => handleFirestoreError(e, OperationType.UPDATE, `sos/${id}`));
    }
  } catch (_) {}

  // Update local storage
  try {
    const raw = localStorage.getItem(SOS_STORAGE_KEY);
    if (raw) {
      const alerts = JSON.parse(raw);
      const updated = alerts.map((a: any) =>
        a.id === id ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy } : a
      );
      localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (_) {}

  // Backend call
  try {
    await fetch(`/api/sos/${id}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolvedBy }),
    });
  } catch (_) {}

  const payload = { type: 'sos_resolved', id, resolvedBy };
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
