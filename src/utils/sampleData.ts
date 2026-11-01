import { Member } from '../types/member';

// Clean SVG avatar generator helper for initial sample members (zero broken images)
export function createAvatarSvgDataUrl(name: string, bgHue: number): string {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${bgHue}, 65%, 45%)"/>
        <stop offset="100%" stop-color="hsl(${bgHue + 25}, 75%, 28%)"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="60" fill="url(#bg)"/>
    <circle cx="60" cy="46" r="22" fill="white" opacity="0.9"/>
    <path d="M24 104 C24 82, 40 76, 60 76 C80 76, 96 82, 96 104 Z" fill="white" opacity="0.9"/>
    <text x="60" y="52" font-family="sans-serif" font-weight="bold" font-size="16" fill="hsl(${bgHue}, 75%, 25%)" text-anchor="middle">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const initialSampleMembers: Member[] = [
  {
    id: 'IA-IND-2026-1084',
    fullName: 'Rajesh Kumar Sharma',
    photoUrl: createAvatarSvgDataUrl('Rajesh Kumar', 215),
    country: 'India',
    whatsappCountryCode: '+374',
    whatsappNumber: '98452103',
    arrivalDateInArmenia: '2024-03-12',
    agentOrAgencyName: 'Global Shanti Overseas Travels (New Delhi)',
    notes: 'Senior DevOps Architect, community cultural coordinator',
    verificationStatus: 'approved',
    registeredAt: '2026-03-12T09:30:00Z',
    updatedAt: '2026-03-12T09:30:00Z',
  },
  {
    id: 'IA-IND-2026-2149',
    fullName: 'Dr. Ananya Mukherjee',
    photoUrl: createAvatarSvgDataUrl('Ananya Mukherjee', 340),
    country: 'India',
    whatsappCountryCode: '+374',
    whatsappNumber: '77619284',
    arrivalDateInArmenia: '2023-09-15',
    agentOrAgencyName: 'MedGlobal Consultants Kolkata',
    notes: 'Resident Physician, volunteer medical mentor for Indian students',
    verificationStatus: 'approved',
    registeredAt: '2026-03-15T11:45:00Z',
    updatedAt: '2026-03-15T11:45:00Z',
  },
  {
    id: 'IA-IND-2026-3091',
    fullName: 'Gurpreet Singh',
    photoUrl: createAvatarSvgDataUrl('Gurpreet Singh', 35),
    country: 'India',
    whatsappCountryCode: '+374',
    whatsappNumber: '93114420',
    arrivalDateInArmenia: '2024-01-20',
    agentOrAgencyName: 'Punjab Gateway Overseas Consultancy (Amritsar)',
    notes: 'Executive Chef & Indian Grocery Importer',
    verificationStatus: 'approved',
    registeredAt: '2026-03-20T14:15:00Z',
    updatedAt: '2026-03-20T14:15:00Z',
  },
  {
    id: 'IA-IND-2026-4428',
    fullName: 'Rohan Patel',
    photoUrl: createAvatarSvgDataUrl('Rohan Patel', 160),
    country: 'India',
    whatsappCountryCode: '+374',
    whatsappNumber: '95802133',
    arrivalDateInArmenia: '2024-06-05',
    agentOrAgencyName: 'Gujarat Skybridge Visa Services (Ahmedabad)',
    notes: 'Civil Project Supervisor in Shirak Province',
    verificationStatus: 'approved',
    registeredAt: '2026-04-02T16:00:00Z',
    updatedAt: '2026-04-02T16:00:00Z',
  },
  {
    id: 'IA-IND-2026-5812',
    fullName: 'Pooja Venkatesh',
    photoUrl: createAvatarSvgDataUrl('Pooja Venkatesh', 280),
    country: 'India',
    whatsappCountryCode: '+374',
    whatsappNumber: '77309918',
    arrivalDateInArmenia: '2023-10-01',
    agentOrAgencyName: 'EduSouth International Pathways (Bengaluru)',
    notes: 'Student council representative',
    verificationStatus: 'approved',
    registeredAt: '2026-04-10T10:10:00Z',
    updatedAt: '2026-04-10T10:10:00Z',
  },
  {
    id: 'IA-IND-2026-6734',
    fullName: 'Amitabh Verma',
    photoUrl: createAvatarSvgDataUrl('Amitabh Verma', 190),
    country: 'India',
    whatsappCountryCode: '+374',
    whatsappNumber: '41992831',
    arrivalDateInArmenia: '2025-02-14',
    agentOrAgencyName: 'Awadh Placement & Travel Agency (Lucknow)',
    notes: 'Looking for warehouse & import-export logistics placement',
    verificationStatus: 'pending',
    registeredAt: '2026-04-14T13:20:00Z',
    updatedAt: '2026-04-14T13:20:00Z',
  },
];
