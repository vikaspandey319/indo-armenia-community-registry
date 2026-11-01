import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import type { Member, SosAlert, VerificationStatus } from '../../src/types/member';

const MEMBER_COOKIE = 'ia_member_session';
const MEMBER_SESSION_SECONDS = 60 * 60 * 12;
const MAX_PHOTO_LENGTH = 1_500_000;

type JsonRecord = Record<string, unknown>;

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function firebase() {
  let app = getApps()[0];
  if (!app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error('Server Firebase credentials are not configured.');
    const serviceAccount = JSON.parse(raw);
    app = initializeApp({ credential: cert(serviceAccount) });
  }
  return { auth: getAuth(app), db: getFirestore(app) };
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get('cookie') || '';
  const match = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

function memberSessionToken(memberId: string, expiresAt: number) {
  const secret = process.env.MEMBER_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Member session secret is not configured.');
  const payload = Buffer.from(JSON.stringify({ memberId, expiresAt })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readMemberSession(request: Request) {
  const token = cookieValue(request, MEMBER_COOKIE);
  const [payload, signature, extra] = token.split('.');
  const secret = process.env.MEMBER_SESSION_SECRET;
  if (!payload || !signature || extra || !secret || secret.length < 32) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof session.memberId === 'string' && session.expiresAt > Date.now()
      ? (session.memberId as string)
      : null;
  } catch {
    return null;
  }
}

function memberCookie(memberId: string) {
  const expiresAt = Date.now() + MEMBER_SESSION_SECONDS * 1000;
  const secure = process.env.NODE_ENV === 'development' ? '' : '; Secure';
  return `${MEMBER_COOKIE}=${encodeURIComponent(memberSessionToken(memberId, expiresAt))}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MEMBER_SESSION_SECONDS}${secure}`;
}

async function adminUser(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!token || !allowedEmail) return null;
  try {
    const { auth } = firebase();
    const decoded = await auth.verifyIdToken(token);
    if (!decoded.email_verified || decoded.email?.toLowerCase() !== allowedEmail) return null;
    return decoded;
  } catch {
    return null;
  }
}

function sanitizeMember(data: JsonRecord, id: string, status: VerificationStatus): Member | null {
  const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
  const country = typeof data.country === 'string' ? data.country.trim() : '';
  const code = typeof data.whatsappCountryCode === 'string' ? data.whatsappCountryCode.trim() : '';
  const phone = typeof data.whatsappNumber === 'string' ? data.whatsappNumber.replace(/\D/g, '') : '';
  const arrivalDate = typeof data.arrivalDateInArmenia === 'string' ? data.arrivalDateInArmenia : '';
  const agency = typeof data.agentOrAgencyName === 'string' ? data.agentOrAgencyName.trim() : '';
  const photo = typeof data.photoUrl === 'string' ? data.photoUrl : '';

  if (
    !fullName || fullName.length > 150 || !country || country.length > 100 ||
    !/^\+\d{1,4}$/.test(code) || !/^\d{6,30}$/.test(phone) ||
    !arrivalDate || arrivalDate.length > 50 || !agency || agency.length > 200 ||
    !photo.startsWith('data:image/') || photo.length > MAX_PHOTO_LENGTH
  ) return null;

  const now = new Date().toISOString();
  const member: Member = {
    id,
    fullName,
    photoUrl: photo,
    country,
    whatsappCountryCode: code,
    whatsappNumber: phone,
    arrivalDateInArmenia: arrivalDate,
    agentOrAgencyName: agency,
    verificationStatus: status,
    registeredAt: now,
    updatedAt: now,
  };
  member.checksum = createHash('sha256')
    .update(`${member.id}:${member.fullName}:${member.whatsappNumber}:${member.registeredAt}`)
    .digest('hex');
  return member;
}

function publicMember(member: Member) {
  return { id: member.id, fullName: member.fullName, photoUrl: member.photoUrl };
}

function rateLimitKey(request: Request) {
  return request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function consumeRateLimit(db: Firestore, request: Request, action: string, limit: number, windowMs: number) {
  const secret = process.env.MEMBER_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Member session secret is not configured.');
  const key = createHmac('sha256', secret).update(`${action}:${rateLimitKey(request)}`).digest('hex');
  const ref = db.collection('rateLimits').doc(key);
  const now = Date.now();
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data();
    const count = current && current.resetAt > now ? Number(current.count || 0) : 0;
    const resetAt = current && current.resetAt > now ? current.resetAt : now + windowMs;
    transaction.set(ref, { count: count + 1, resetAt });
    return count < limit;
  });
}

async function syncGoogleSheet(db: Firestore, members: Member[]) {
  const settingsRef = db.collection('settings').doc('google-sheets');
  const settingsSnap = await settingsRef.get();
  const settings = settingsSnap.data() || {};
  const webhookUrl = typeof settings.webhookUrl === 'string' ? settings.webhookUrl : '';
  if (!settings.autoSync || !webhookUrl) return;
  const parsed = new URL(webhookUrl);
  if (parsed.hostname !== 'script.google.com' || parsed.protocol !== 'https:') return;
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sync_all', organization: 'Indo Armenia LLC', syncedAt: new Date().toISOString(), members }),
  });
  if (!response.ok) throw new Error('Google Sheets auto-sync failed.');
  await settingsRef.set({ lastSyncedAt: new Date().toISOString(), totalSynced: members.length }, { merge: true });
}

function csvValue(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export default async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname
    .replace(/^\/\.netlify\/functions\/api/, '/api')
    .replace(/\/$/, '') || '/';
  const method = request.method.toUpperCase();

  try {
    if (path === '/api/health' && method === 'GET') {
      return json({ status: 'ok', service: 'indo-armenia-api' });
    }

    if (path === '/api/admin/session' && method === 'GET') {
      const user = await adminUser(request);
      return user ? json({ authenticated: true, email: user.email }) : json({ authenticated: false }, 401);
    }

    const { db } = firebase();
    const members = db.collection('members');

    if (path === '/api/members' && method === 'GET') {
      const admin = await adminUser(request);
      const memberId = admin ? null : readMemberSession(request);
      if (!admin && !memberId) return json({ error: 'Member or administrator access required.' }, 401);
      if (memberId) {
        const ownRecord = await members.doc(memberId).get();
        if (!ownRecord.exists || ownRecord.data()?.verificationStatus !== 'approved') {
          return json({ error: 'Member access is available after registration approval.' }, 403);
        }
      }
      const snapshot = await members.orderBy('registeredAt', 'desc').get();
      const records = snapshot.docs.map((doc) => doc.data() as Member);
      return json({ data: admin ? records : records.map(publicMember), count: records.length });
    }

    if (path === '/api/members/verify' && method === 'POST') {
      if (!await consumeRateLimit(db, request, 'member-verification', 8, 15 * 60 * 1000)) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
      const body = await request.json() as JsonRecord;
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      const code = typeof body.whatsappCountryCode === 'string' ? body.whatsappCountryCode.trim() : '';
      const phone = typeof body.whatsappNumber === 'string' ? body.whatsappNumber.replace(/\D/g, '') : '';
      const record = id ? await members.doc(id).get() : null;
      const data = record?.exists ? record.data() as Member : null;
      const matches = data && data.whatsappCountryCode === code && data.whatsappNumber.replace(/\D/g, '') === phone;
      if (!matches) return json({ error: 'Member ID and WhatsApp number did not match.' }, 401);
      if (data.verificationStatus !== 'approved') return json({ error: 'This registration is still awaiting administrator approval.' }, 403);
      return json({ data: publicMember(data) }, 200, { 'Set-Cookie': memberCookie(data.id) });
    }

    if (path === '/api/members' && method === 'POST') {
      const body = await request.json() as JsonRecord;
      const year = new Date().getFullYear();
      let member: Member | null = null;
      for (let tries = 0; tries < 12 && !member; tries += 1) {
        const id = `IA-IND-${year}-${randomInt(1000, 10000)}`;
        const candidate = sanitizeMember(body, id, 'pending');
        if (!candidate) return json({ error: 'Please check the registration details and photo.' }, 400);
        const ref = members.doc(id);
        const created = await db.runTransaction(async (transaction) => {
          const existing = await transaction.get(ref);
          if (existing.exists) return false;
          transaction.create(ref, candidate);
          return true;
        });
        if (created) member = candidate;
      }
      if (!member) return json({ error: 'Could not create a unique member ID. Please retry.' }, 503);
      try {
        const snapshot = await members.orderBy('registeredAt', 'desc').get();
        await syncGoogleSheet(db, snapshot.docs.map((doc) => doc.data() as Member));
      } catch (error) {
        console.error('Google Sheets auto-sync failed:', error instanceof Error ? error.message : 'Unknown error');
      }
      return json({ data: member }, 201, { 'Set-Cookie': memberCookie(member.id) });
    }

    if (path === '/api/members/restore' && method === 'POST') {
      if (!await adminUser(request)) return json({ error: 'Administrator access required.' }, 401);
      const body = await request.json() as JsonRecord;
      if (!Array.isArray(body.members) || body.members.length > 4000) return json({ error: 'Backup member list is invalid or too large.' }, 400);
      let restoredCount = 0;
      for (let offset = 0; offset < body.members.length; offset += 400) {
        const batch = db.batch();
        for (const raw of body.members.slice(offset, offset + 400)) {
          if (!raw || typeof raw !== 'object') continue;
          const item = raw as JsonRecord;
          const id = typeof item.id === 'string' ? item.id.trim() : '';
          const status = ['approved', 'pending', 'flagged', 'rejected'].includes(String(item.verificationStatus))
            ? item.verificationStatus as VerificationStatus
            : 'pending';
          const restored = sanitizeMember(item, id, status);
          if (!restored) continue;
          if (typeof item.notes === 'string' && item.notes.length <= 2000) restored.notes = item.notes;
          batch.set(members.doc(id), restored);
          restoredCount += 1;
        }
        await batch.commit();
      }
      return json({ success: true, count: restoredCount });
    }

    const memberMatch = path.match(/^\/api\/members\/([^/]+)$/);
    if (memberMatch && (method === 'PATCH' || method === 'DELETE')) {
      const admin = await adminUser(request);
      if (!admin) return json({ error: 'Administrator access required.' }, 401);
      const id = decodeURIComponent(memberMatch[1]);
      const ref = members.doc(id);
      const existing = await ref.get();
      if (!existing.exists) return json({ error: 'Member not found.' }, 404);
      if (method === 'DELETE') {
        await ref.delete();
        return json({ success: true });
      }
      const body = await request.json() as JsonRecord;
      const status = body.verificationStatus;
      if (status !== undefined && !['approved', 'pending', 'flagged', 'rejected'].includes(String(status))) {
        return json({ error: 'Invalid verification status.' }, 400);
      }
      const notes = body.notes;
      if (notes !== undefined && (typeof notes !== 'string' || notes.length > 2000)) {
        return json({ error: 'Admin notes are too long.' }, 400);
      }
      const updates: JsonRecord = { updatedAt: new Date().toISOString() };
      if (status !== undefined) updates.verificationStatus = status;
      if (notes !== undefined) updates.notes = notes;
      await ref.update(updates);
      return json({ data: { ...existing.data(), ...updates } });
    }

    if (path === '/api/sos' && method === 'POST') {
      if (!await consumeRateLimit(db, request, 'sos-dispatch', 5, 10 * 60 * 1000)) return json({ error: 'Too many SOS alerts. Please contact emergency services directly.' }, 429);
      const body = await request.json() as JsonRecord;
      const memberName = typeof body.memberName === 'string' ? body.memberName.slice(0, 150) : 'Community Member';
      const phone = typeof body.phone === 'string' ? body.phone.slice(0, 40) : 'Emergency Helpline';
      const category = typeof body.category === 'string' ? body.category.slice(0, 50) : 'general';
      const message = typeof body.message === 'string' ? body.message.slice(0, 2000) : 'Emergency assistance requested.';
      const location = typeof body.location === 'string' ? body.location.slice(0, 200) : 'Armenia';
      const alert: SosAlert = {
        id: `SOS-${Date.now().toString(36).toUpperCase()}-${randomInt(1000, 10000)}`,
        memberName,
        phone,
        category: ['medical', 'police', 'legal', 'accident', 'general', 'distress'].includes(category) ? category as SosAlert['category'] : 'general',
        message,
        location,
        timestamp: new Date().toISOString(),
        status: 'active',
      };
      await db.collection('sos').doc(alert.id).create(alert);
      return json({ data: alert }, 201);
    }

    if (path === '/api/sos' && method === 'GET') {
      if (!await adminUser(request)) return json({ error: 'Administrator access required.' }, 401);
      const snapshot = await db.collection('sos').orderBy('timestamp', 'desc').limit(500).get();
      return json({ data: snapshot.docs.map((doc) => doc.data()) });
    }

    const sosMatch = path.match(/^\/api\/sos\/([^/]+)\/resolve$/);
    if (sosMatch && method === 'PATCH') {
      const admin = await adminUser(request);
      if (!admin) return json({ error: 'Administrator access required.' }, 401);
      const ref = db.collection('sos').doc(decodeURIComponent(sosMatch[1]));
      const existing = await ref.get();
      if (!existing.exists) return json({ error: 'SOS alert not found.' }, 404);
      const data = { status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: admin.email || 'Administrator' };
      await ref.update(data);
      return json({ data: { ...existing.data(), ...data } });
    }

    if (path === '/api/members/csv' && method === 'GET') {
      if (!await adminUser(request)) return json({ error: 'Administrator access required.' }, 401);
      const snapshot = await members.orderBy('registeredAt', 'desc').get();
      const headers = ['Member ID', 'Full Name', 'Home Country', 'WhatsApp Country Code', 'WhatsApp Number', 'Arrival Date in Armenia', 'Agency / Agent Name', 'Status', 'Registered Date'];
      const rows = snapshot.docs.map((doc) => {
        const m = doc.data() as Member;
        return [m.id, m.fullName, m.country, m.whatsappCountryCode, m.whatsappNumber, m.arrivalDateInArmenia, m.agentOrAgencyName, m.verificationStatus, m.registeredAt].map(csvValue).join(',');
      });
      return new Response(`\uFEFF${[headers.join(','), ...rows].join('\r\n')}`, {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="indo_armenia_members.csv"' },
      });
    }

    if (path === '/api/google-sheets/config' && (method === 'GET' || method === 'POST')) {
      if (!await adminUser(request)) return json({ error: 'Administrator access required.' }, 401);
      const ref = db.collection('settings').doc('google-sheets');
      if (method === 'GET') {
        const snapshot = await ref.get();
        return json({ data: snapshot.exists ? snapshot.data() : { webhookUrl: '', sheetUrl: '', autoSync: false } });
      }
      const body = await request.json() as JsonRecord;
      const webhookUrl = typeof body.webhookUrl === 'string' ? body.webhookUrl.trim() : '';
      if (webhookUrl) {
        let host = '';
        try { host = new URL(webhookUrl).hostname; } catch { return json({ error: 'Invalid webhook URL.' }, 400); }
        if (host !== 'script.google.com' || !webhookUrl.startsWith('https://')) return json({ error: 'Only HTTPS Google Apps Script URLs are allowed.' }, 400);
      }
      const config = {
        webhookUrl,
        sheetUrl: typeof body.sheetUrl === 'string' ? body.sheetUrl.slice(0, 500) : '',
        autoSync: body.autoSync === true,
      };
      await ref.set(config, { merge: true });
      return json({ data: config });
    }

    if (path === '/api/google-sheets/sync' && method === 'POST') {
      if (!await adminUser(request)) return json({ error: 'Administrator access required.' }, 401);
      const body = await request.json() as JsonRecord;
      const settingsRef = db.collection('settings').doc('google-sheets');
      const settingsSnap = await settingsRef.get();
      const settings = settingsSnap.data() || {};
      const webhookUrl = typeof body.webhookUrl === 'string' ? body.webhookUrl : String(settings.webhookUrl || '');
      const snapshot = await members.orderBy('registeredAt', 'desc').get();
      const records = snapshot.docs.map((doc) => doc.data() as Member);
      if (webhookUrl) {
        const host = new URL(webhookUrl).hostname;
        if (host !== 'script.google.com' || !webhookUrl.startsWith('https://')) return json({ error: 'Only HTTPS Google Apps Script URLs are allowed.' }, 400);
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_all', organization: 'Indo Armenia LLC', syncedAt: new Date().toISOString(), members: records }),
        });
        if (!response.ok) return json({ error: 'Google Sheets webhook rejected the sync.' }, 502);
      }
      await settingsRef.set({ lastSyncedAt: new Date().toISOString(), totalSynced: records.length }, { merge: true });
      return json({ success: true, totalSynced: records.length });
    }

    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    console.error('API request failed:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof SyntaxError) return json({ error: 'Invalid JSON request.' }, 400);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('credentials are not configured') || message.includes('secret is not configured')) {
      return json({ error: 'Server configuration is incomplete.' }, 503);
    }
    return json({ error: 'The request could not be completed.' }, 500);
  }
};
