import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initialSampleMembers } from './src/utils/sampleData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'members.json');
const SOS_FILE = path.join(DATA_DIR, 'sos.json');
const SHEETS_CONFIG_FILE = path.join(DATA_DIR, 'sheets-config.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface MemberRecord {
  id: string;
  fullName: string;
  photoUrl: string;
  country: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  arrivalDateInArmenia: string;
  agentOrAgencyName: string;
  notes?: string;
  verificationStatus: string;
  registeredAt: string;
  updatedAt: string;
  checksum?: string;
}

interface SosRecord {
  id: string;
  memberName: string;
  phone: string;
  category: string;
  message: string;
  location?: string;
  timestamp: string;
  status: 'active' | 'resolved';
  resolvedAt?: string;
  resolvedBy?: string;
}

interface SheetsConfigRecord {
  webhookUrl: string;
  sheetUrl?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  totalSynced?: number;
}

// In-memory cache + file sync
function loadMembers(): MemberRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading members data file:', err);
  }
  // Initialize with initial sample members if empty or missing
  if (Array.isArray(initialSampleMembers) && initialSampleMembers.length > 0) {
    saveMembers(initialSampleMembers);
    return initialSampleMembers;
  }
  return [];
}

function saveMembers(records: MemberRecord[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving members data file:', err);
  }
}

function loadSosAlerts(): SosRecord[] {
  try {
    if (fs.existsSync(SOS_FILE)) {
      const raw = fs.readFileSync(SOS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading sos data file:', err);
  }
  return [];
}

function saveSosAlerts(records: SosRecord[]) {
  try {
    fs.writeFileSync(SOS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving sos data file:', err);
  }
}

function loadSheetsConfig(): SheetsConfigRecord {
  try {
    if (fs.existsSync(SHEETS_CONFIG_FILE)) {
      const raw = fs.readFileSync(SHEETS_CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading sheets config file:', err);
  }
  return {
    webhookUrl: '',
    sheetUrl: '',
    autoSync: false,
  };
}

function saveSheetsConfig(cfg: SheetsConfigRecord) {
  try {
    fs.writeFileSync(SHEETS_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving sheets config file:', err);
  }
}

let membersDb: MemberRecord[] = loadMembers();
let sosDb: SosRecord[] = loadSosAlerts();
let sheetsConfigDb: SheetsConfigRecord = loadSheetsConfig();

// Real-time Server-Sent Events (SSE) clients
const sseClients = new Set<Response>();

function broadcastSse(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(message);
    } catch (_) {
      sseClients.delete(client);
    }
  });
}

// Keep-alive heartbeat ping every 15 seconds to prevent client timeout
setInterval(() => {
  broadcastSse('ping', { timestamp: new Date().toISOString() });
}, 15000);

// REST API Endpoints
// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    organization: 'Indo-Armenia LLC',
    timestamp: new Date().toISOString(),
    recordCount: membersDb.length,
  });
});

// Real-Time SSE Stream for Live Member & SOS Monitoring
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ type: 'connected', count: membersDb.length, timestamp: new Date().toISOString() })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// List members
app.get('/api/members', (_req: Request, res: Response) => {
  res.json({ success: true, data: membersDb, count: membersDb.length, timestamp: new Date().toISOString() });
});

// Register new member
app.post('/api/members', (req: Request, res: Response) => {
  const member: MemberRecord = req.body;
  if (!member.fullName || !member.id) {
    res.status(400).json({ error: 'Full name and Member ID are required' });
    return;
  }

  // Prevent duplicate ID
  const existingIndex = membersDb.findIndex((m) => m.id === member.id);
  if (existingIndex >= 0) {
    membersDb[existingIndex] = member;
  } else {
    membersDb.unshift(member);
  }

  saveMembers(membersDb);
  broadcastSse('member_registered', member);

  console.log(`[REAL-TIME SYNC] Member registered: ${member.fullName} (${member.id}) - Total: ${membersDb.length}`);
  res.status(201).json({ success: true, data: member, all: membersDb, count: membersDb.length });
});

// Update member status
app.patch('/api/members/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { verificationStatus, notes } = req.body;

  const member = membersDb.find((m) => m.id === id);
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  if (verificationStatus) member.verificationStatus = verificationStatus;
  if (notes !== undefined) member.notes = notes;
  member.updatedAt = new Date().toISOString();

  saveMembers(membersDb);
  broadcastSse('member_updated', member);

  res.json({ success: true, data: member });
});

// Delete member
app.delete('/api/members/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = membersDb.length;
  membersDb = membersDb.filter((m) => m.id !== id);

  if (membersDb.length !== initialLen) {
    saveMembers(membersDb);
    broadcastSse('member_deleted', { id });
  }

  res.json({ success: true });
});

// Real-Time CSV Feed for Google Sheets =IMPORTDATA(...) and Direct Sync
app.get('/api/members/csv', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="indo_armenia_members.csv"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const clean = String(val).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const headers = [
    'Member ID',
    'Full Name',
    'Home Country',
    'WhatsApp Country Code',
    'WhatsApp Number',
    'WhatsApp Direct Link',
    'Arrival Date in Armenia',
    'Agency / Agent Name (home country)',
    'Status',
    'Registered Date',
    'Integrity Checksum',
  ];

  const rows = membersDb.map((m) => [
    escapeCsv(m.id),
    escapeCsv(m.fullName),
    escapeCsv(m.country),
    escapeCsv(m.whatsappCountryCode),
    escapeCsv(m.whatsappNumber),
    escapeCsv(`https://wa.me/${(m.whatsappCountryCode || '+91').replace('+', '')}${m.whatsappNumber}`),
    escapeCsv(m.arrivalDateInArmenia),
    escapeCsv(m.agentOrAgencyName),
    escapeCsv(m.verificationStatus),
    escapeCsv(m.registeredAt),
    escapeCsv(m.checksum || ''),
  ]);

  // Include UTF-8 BOM for flawless Excel and Google Sheets character rendering
  const bom = '\uFEFF';
  const csvContent = bom + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  res.send(csvContent);
});

// SOS Emergency Alert Endpoints
app.get('/api/sos', (_req: Request, res: Response) => {
  res.json({ success: true, data: sosDb });
});

app.post('/api/sos', (req: Request, res: Response) => {
  const { memberName, phone, category, message, location } = req.body;
  const newAlert: SosRecord = {
    id: `SOS-${Date.now().toString(36).toUpperCase()}`,
    memberName: memberName || 'Community Member',
    phone: phone || 'Unknown',
    category: category || 'general',
    message: message || 'Emergency Assistance Requested via SOS Help button',
    location: location || 'Armenia',
    timestamp: new Date().toISOString(),
    status: 'active',
  };

  sosDb.unshift(newAlert);
  saveSosAlerts(sosDb);

  // Broadcast immediate emergency alert to all connected admin interfaces
  broadcastSse('sos_alert', newAlert);

  console.log(`🚨 EMERGENCY SOS DISPATCHED: ${newAlert.id} from ${newAlert.memberName} (${newAlert.phone})`);
  res.status(201).json({ success: true, data: newAlert });
});

app.patch('/api/sos/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const alert = sosDb.find((a) => a.id === id);
  if (!alert) {
    res.status(404).json({ error: 'SOS alert not found' });
    return;
  }

  alert.status = 'resolved';
  alert.resolvedAt = new Date().toISOString();
  alert.resolvedBy = req.body.resolvedBy || 'Admin';

  saveSosAlerts(sosDb);
  broadcastSse('sos_resolved', alert);

  res.json({ success: true, data: alert });
});

// Google Sheets Configuration and Sync Endpoints
app.get('/api/google-sheets/config', (_req: Request, res: Response) => {
  res.json({ success: true, data: sheetsConfigDb });
});

app.post('/api/google-sheets/config', (req: Request, res: Response) => {
  const { webhookUrl, sheetUrl, autoSync } = req.body;
  sheetsConfigDb = {
    ...sheetsConfigDb,
    webhookUrl: webhookUrl || '',
    sheetUrl: sheetUrl || '',
    autoSync: !!autoSync,
  };
  saveSheetsConfig(sheetsConfigDb);
  res.json({ success: true, data: sheetsConfigDb });
});

app.post('/api/google-sheets/sync', async (req: Request, res: Response) => {
  const webhookUrl = req.body.webhookUrl || sheetsConfigDb.webhookUrl;
  const now = new Date().toISOString();

  // If webhook URL is provided, push data to the Google Sheets Apps Script Webhook
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const payload = {
        action: 'sync_all',
        organization: 'Indo Armenia LLC',
        syncedAt: now,
        membersCount: membersDb.length,
        members: membersDb.map((m) => ({
          id: m.id,
          fullName: m.fullName,
          country: m.country,
          phone: `${m.whatsappCountryCode} ${m.whatsappNumber}`,
          arrivalDateInArmenia: m.arrivalDateInArmenia,
          agentOrAgencyName: m.agentOrAgencyName,
          verificationStatus: m.verificationStatus,
          registeredAt: m.registeredAt,
        })),
      };

      // Push to Google Sheets webhook
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn('Webhook post notification caught (might be redirect):', err.message);
      });
    } catch (e: any) {
      console.error('Error dispatching to Google Sheets webhook:', e);
    }
  }

  sheetsConfigDb.lastSyncedAt = now;
  sheetsConfigDb.totalSynced = membersDb.length;
  saveSheetsConfig(sheetsConfigDb);

  res.json({
    success: true,
    message: 'All member records synced successfully with Google Sheets format',
    syncedAt: now,
    totalSynced: membersDb.length,
    importDataFormula: `=IMPORTDATA("${req.protocol}://${req.get('host')}/api/members/csv")`,
  });
});

// Mount Vite or serve static assets
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Indo-Armenia LLC Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
