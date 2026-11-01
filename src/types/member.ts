export type VerificationStatus = 'approved' | 'pending' | 'flagged';

export interface Member {
  id: string; // unique member ID, e.g. IA-IND-2026-7842
  fullName: string;
  photoUrl: string; // Base64 data URL or uploaded photo
  country: string; // Home country
  whatsappCountryCode: string; // e.g. +374, +91
  whatsappNumber: string; // e.g. 98123456
  arrivalDateInArmenia: string; // Date of arrival in Armenia (e.g. YYYY-MM-DD)
  agentOrAgencyName: string; // Agency / Agent Name (home country)
  notes?: string;
  verificationStatus: VerificationStatus;
  registeredAt: string; // ISO date string
  updatedAt: string;
  checksum?: string; // SHA-256 integrity token
}

export interface EncryptedBackupPayload {
  version: string;
  organization: string;
  exportedAt: string;
  recordCount: number;
  encryptedData: string; // Base64 AES-GCM ciphertext
  iv: string; // Base64 Initialization Vector
  salt: string; // Base64 PBKDF2 salt
  checksum: string; // SHA-256 hash of original data
}

export type AppLanguage = 'en' | 'hi' | 'hy' | 'ru';

export type TextScale = 'normal' | 'large' | 'xlarge';

export interface SosAlert {
  id: string;
  memberName: string;
  phone: string;
  category: 'medical' | 'police' | 'legal' | 'accident' | 'general';
  message: string;
  location?: string;
  timestamp: string;
  status: 'active' | 'resolved';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface GoogleSheetConfig {
  webhookUrl: string;
  sheetUrl?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  totalSynced?: number;
}
