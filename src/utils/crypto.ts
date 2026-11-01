/**
 * Cryptographic and security utilities for Indo-Armenia LLC Registry
 * Uses Web Crypto API for client-side AES-GCM 256 encryption,
 * PBKDF2 key derivation, and SHA-256 data integrity checks.
 */

import { EncryptedBackupPayload, Member } from '../types/member';

/**
 * Generate a unique, dignified Member ID for Indo-Armenia LLC.
 * Format: IA-IND-2026-XXXX (where XXXX is a 4-digit unique identifier)
 */
export function generateMemberId(existingIds: string[] = []): string {
  const year = new Date().getFullYear();
  let candidate = '';
  let attempts = 0;
  do {
    // 4-digit number between 1000 and 9999
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    candidate = `IA-IND-${year}-${randomCode}`;
    attempts++;
  } while (existingIds.includes(candidate) && attempts < 100);

  return candidate;
}

/**
 * Compute SHA-256 checksum of any string data
 */
export async function computeSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Helper to convert ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper to convert Base64 to Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive an AES-GCM 256-bit key from a user passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt members database into an EncryptedBackupPayload using AES-GCM 256
 */
export async function encryptMembersBackup(
  members: Member[],
  passphrase: string
): Promise<EncryptedBackupPayload> {
  const jsonString = JSON.stringify(members);
  const checksum = await computeSha256(jsonString);

  // Generate random 16-byte salt and 12-byte IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(jsonString);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    plaintextBuffer
  );

  return {
    version: '1.0.0',
    organization: 'Indo-Armenia LLC',
    exportedAt: new Date().toISOString(),
    recordCount: members.length,
    encryptedData: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    checksum,
  };
}

/**
 * Decrypt an EncryptedBackupPayload using user passphrase and verify SHA-256 integrity
 */
export async function decryptMembersBackup(
  payload: EncryptedBackupPayload,
  passphrase: string
): Promise<{ success: boolean; members?: Member[]; error?: string }> {
  try {
    const salt = base64ToBuffer(payload.salt);
    const iv = base64ToBuffer(payload.iv);
    const ciphertext = base64ToBuffer(payload.encryptedData);

    const key = await deriveKey(passphrase, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    const decryptedJson = decoder.decode(decryptedBuffer);

    // Verify SHA-256 integrity
    const calculatedChecksum = await computeSha256(decryptedJson);
    if (calculatedChecksum !== payload.checksum) {
      return {
        success: false,
        error: 'Data integrity check failed: Checksum mismatch. The file may be corrupted or tampered.',
      };
    }

    const members: Member[] = JSON.parse(decryptedJson);
    return { success: true, members };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to decrypt backup. Please verify your passphrase is correct.',
    };
  }
}

/**
 * Compress an uploaded photo file into a high-quality, lightweight Base64 data URL
 * Resizes max dimension to 800px, compression quality 0.85.
 */
export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 640;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG with 0.82 quality for optimal size & photo fidelity
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      if (typeof readerEvent.target?.result === 'string') {
        img.src = readerEvent.target.result;
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
