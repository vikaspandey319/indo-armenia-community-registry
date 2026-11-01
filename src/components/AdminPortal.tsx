import React, { useState, useMemo, useEffect } from 'react';
import { Member, VerificationStatus, AppLanguage, SosAlert } from '../types/member';
import { translations } from '../utils/translations';
import {
  updateMemberStatus,
  deleteMember,
  exportMembersToCsv,
  getSosAlerts,
  resolveSosAlert,
  subscribeToSosAlerts,
} from '../services/storage';
import { DigitalIdCard } from './DigitalIdCard';
import { CloudBackupModal } from './CloudBackupModal';
import { GoogleSheetSyncModal } from './GoogleSheetSyncModal';
import { AdminSosPopupModal } from './AdminSosPopupModal';
import { CrestLogo } from './CrestLogo';
import {
  Users,
  Search,
  Filter,
  Download,
  Shield,
  Phone,
  Printer,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Eye,
  Trash2,
  ExternalLink,
  Briefcase,
  MapPin,
  RefreshCw,
  X,
  FileSpreadsheet,
  Globe2,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface AdminPortalProps {
  members: Member[];
  language: AppLanguage;
  onRefresh: () => void;
  onMembersUpdated: (updatedList: Member[]) => void;
  latestSubmissionsCount: number;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  members,
  language,
  onRefresh,
  onMembersUpdated,
  latestSubmissionsCount,
}) => {
  const t = translations[language];

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedAgency, setSelectedAgency] = useState<string>('all');

  // Member Inspection Modal
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [isViewingCard, setIsViewingCard] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>('');

  // Backup Modal & Google Sheet Modal
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);

  // SOS Emergency Alerts & Siren State
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [activeSosModalAlert, setActiveSosModalAlert] = useState<SosAlert | null>(null);

  // Load and listen to SOS alerts in real-time
  useEffect(() => {
    const fetchAlerts = async () => {
      const list = await getSosAlerts();
      setSosAlerts(list);
      const activeUnresolved = list.find((a: SosAlert) => a.status === 'active');
      if (activeUnresolved && !activeSosModalAlert) {
        setActiveSosModalAlert(activeUnresolved);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 4000);

    const unsubscribe = subscribeToSosAlerts((event) => {
      if (event.type === 'sos_alert' && event.alert) {
        setSosAlerts((prev) => [event.alert, ...prev]);
        setActiveSosModalAlert(event.alert);
      } else if (event.type === 'sos_resolved') {
        setSosAlerts((prev) =>
          prev.map((a) => (a.id === event.id ? { ...a, status: 'resolved' } : a))
        );
        setActiveSosModalAlert((prev) => (prev?.id === event.id ? null : prev));
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleResolveSos = async (id: string) => {
    await resolveSosAlert(id);
    setSosAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a))
    );
    setActiveSosModalAlert(null);
  };

  // Filtered members calculation
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.fullName.toLowerCase().includes(q);
        const matchesId = m.id.toLowerCase().includes(q);
        const matchesPhone = m.whatsappNumber.includes(q);
        const matchesCountry = m.country.toLowerCase().includes(q);
        const matchesAgency = m.agentOrAgencyName.toLowerCase().includes(q);
        const matchesArrival = m.arrivalDateInArmenia.toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesId &&
          !matchesPhone &&
          !matchesCountry &&
          !matchesAgency &&
          !matchesArrival
        ) {
          return false;
        }
      }

      // Country filter
      if (selectedCountry !== 'all' && m.country !== selectedCountry) {
        return false;
      }

      // Agency filter
      if (selectedAgency !== 'all' && m.agentOrAgencyName !== selectedAgency) {
        return false;
      }

      return true;
    });
  }, [members, searchQuery, selectedCountry, selectedAgency]);

  // Unique lists for filter dropdowns
  const uniqueCountries = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.country) set.add(m.country);
    });
    return Array.from(set);
  }, [members]);

  const uniqueAgencies = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.agentOrAgencyName) set.add(m.agentOrAgencyName);
    });
    return Array.from(set);
  }, [members]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const total = members.length;
    const verified = members.filter((m) => m.verificationStatus === 'approved').length;
    const uniqueCountriesCount = new Set(members.map((m) => m.country)).size;
    const uniqueAgenciesCount = new Set(members.map((m) => m.agentOrAgencyName)).size;

    return { total, verified, uniqueCountriesCount, uniqueAgenciesCount };
  }, [members]);

  const handleOpenMemberModal = (m: Member) => {
    setActiveMember(m);
    setAdminNotes(m.notes || '');
    setIsViewingCard(false);
  };

  const handleStatusChange = (status: VerificationStatus) => {
    if (!activeMember) return;
    const updatedList = updateMemberStatus(activeMember.id, status, adminNotes);
    onMembersUpdated(updatedList);
    setActiveMember((prev) => (prev ? { ...prev, verificationStatus: status, notes: adminNotes } : null));
  };

  const handleSaveNotes = () => {
    if (!activeMember) return;
    const updatedList = updateMemberStatus(activeMember.id, activeMember.verificationStatus, adminNotes);
    onMembersUpdated(updatedList);
    setActiveMember((prev) => (prev ? { ...prev, notes: adminNotes } : null));
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Are you sure you want to remove this member registration?')) {
      const updatedList = deleteMember(id);
      onMembersUpdated(updatedList);
      if (activeMember?.id === id) {
        setActiveMember(null);
      }
    }
  };

  const handleOpenWhatsAppChat = (member: Member) => {
    const rawNumber = `${member.whatsappCountryCode.replace('+', '')}${member.whatsappNumber.replace(
      /\s+/g,
      ''
    )}`;
    const greeting = encodeURIComponent(
      `Namaste ${member.fullName}! This is Indo Armenia LLC Administration regarding your community membership ID (${member.id}).`
    );
    window.open(`https://wa.me/${rawNumber}?text=${greeting}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner with Official Indo Armenia LLC Logo (Brown Admin Theme - User Request) */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-[#3d1a08] to-slate-950 p-6 text-white border-2 border-[#8B4513]/70 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Warm brown background glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#8B4513]/30 via-[#78350F]/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#8B4513]/25 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <CrestLogo size={72} />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <span>Indo Armenia LLC</span>
              <span>·</span>
              <span className="text-amber-200">Admin Control Center</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[11px] font-black tracking-normal">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>REAL-TIME SYNC LIVE</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Member Registry & Database Management
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
              Real-time monitoring and secure encrypted cloud vault for registered Indian community members.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* User Request: Admin tab give option to link all data with google sheet */}
          <button
            onClick={() => setIsGoogleSheetModalOpen(true)}
            className="px-4 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white transition-all flex items-center gap-2 shadow-md cursor-pointer border border-emerald-400/40"
            title="Link all member data with Google Sheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Link Google Sheet</span>
          </button>

          <button
            onClick={() => exportMembersToCsv(members)}
            className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-700 bg-slate-900/90 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 transition-all flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Shield className="w-4 h-4 text-slate-950" />
            <span>Encrypted Cloud Backup</span>
          </button>

          <button
            onClick={onRefresh}
            className="px-3.5 py-2.5 rounded-xl border border-[#8B4513]/70 bg-slate-900/95 text-amber-200 hover:text-white hover:bg-[#5c2c16] transition-all flex items-center gap-2 text-xs font-black cursor-pointer shadow-md active:scale-95"
            title="Refresh database live from server"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Active SOS Emergency Banner if any alert is active */}
      {sosAlerts.filter((a) => a.status === 'active').length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-950/40 border-2 border-red-400 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center font-black animate-bounce shadow">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-amber-200">
                🚨 {sosAlerts.filter((a) => a.status === 'active').length} ACTIVE SOS EMERGENCY ALERT(S)
              </div>
              <p className="text-xs text-red-100 font-semibold mt-0.5">
                Community member has activated the emergency help button. Siren sound alert is queued.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const active = sosAlerts.find((a) => a.status === 'active');
              if (active) setActiveSosModalAlert(active);
            }}
            className="px-4 py-2 rounded-xl bg-white hover:bg-amber-100 text-red-700 font-black text-xs uppercase shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            OPEN SIREN SOS ALERT POPUP
          </button>
        </div>
      )}

      {/* Colourful KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-orange-200/80 shadow-md">
          <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">Total Members</div>
          <div className="text-3xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Registered in Database</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200/80 shadow-md">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Verified ID Cards</div>
          <div className="text-3xl font-black text-emerald-700 font-mono tabular-nums mt-1">
            {metrics.verified}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {metrics.total > 0 ? Math.round((metrics.verified / metrics.total) * 100) : 0}% Approved
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200/80 shadow-md">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Home Countries</div>
          <div className="text-3xl font-black text-indigo-700 font-mono tabular-nums mt-1">
            {metrics.uniqueCountriesCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Countries Represented</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-amber-200/80 shadow-md">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Agencies / Agents</div>
          <div className="text-3xl font-black text-amber-700 font-mono tabular-nums mt-1">
            {metrics.uniqueAgenciesCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Recruiting Sources</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, member ID, phone, agency, or country..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Home Countries</option>
            {uniqueCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Agency Filter */}
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Agencies / Agents</option>
            {uniqueAgencies.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <span className="font-bold text-slate-900 font-mono tabular-nums">{filteredMembers.length}</span> of{' '}
            <span className="font-mono tabular-nums">{members.length}</span> registered members
          </div>
          {(selectedCountry !== 'all' || selectedAgency !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('all');
                setSelectedAgency('all');
              }}
              className="text-amber-700 hover:text-amber-800 font-bold underline underline-offset-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* High Density Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="py-3.5 px-4 font-mono">Member ID</th>
                <th className="py-3.5 px-4">Member Photo & Name</th>
                <th className="py-3.5 px-4">Home Country</th>
                <th className="py-3.5 px-4">Arrival in Armenia</th>
                <th className="py-3.5 px-4">Agency / Agent Name</th>
                <th className="py-3.5 px-4">WhatsApp No</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No members match the selected search criteria or filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-amber-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenMemberModal(member)}
                  >
                    {/* Member ID */}
                    <td className="py-3.5 px-4 font-mono font-black text-amber-700 whitespace-nowrap tabular-nums">
                      {member.id}
                    </td>

                    {/* Photo + Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300 shadow-2xs">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                              {member.fullName[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                            {member.fullName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Home Country */}
                    <td className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">
                      {member.country}
                    </td>

                    {/* Arrival Date in Armenia */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {member.arrivalDateInArmenia}
                    </td>

                    {/* Agency / Agent Name */}
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {member.agentOrAgencyName}
                    </td>

                    {/* WhatsApp */}
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenWhatsAppChat(member)}
                        className="inline-flex items-center gap-1.5 font-mono text-emerald-700 hover:text-emerald-800 font-bold hover:underline tabular-nums"
                        title="Chat on WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {member.whatsappCountryCode} {member.whatsappNumber}
                        </span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenMemberModal(member)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="View Dossier & ID Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveMember(member);
                            setIsViewingCard(true);
                          }}
                          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                          title="Print / View Card"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Member Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Inspection & Dossier Modal */}
      {activeMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between sticky top-0 z-10 border-b border-amber-500/30">
              <div className="flex items-center gap-3">
                <CrestLogo size={36} />
                <span className="font-mono text-amber-400 font-black text-sm">
                  {activeMember.id}
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-bold text-sm truncate max-w-xs">
                  {activeMember.fullName}
                </span>
              </div>
              <button
                onClick={() => setActiveMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {isViewingCard ? (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Official Membership Badge Preview
                    </h3>
                    <button
                      onClick={() => setIsViewingCard(false)}
                      className="text-xs text-amber-700 hover:underline font-bold"
                    >
                      ← Back to Dossier
                    </button>
                  </div>
                  <DigitalIdCard
                    member={activeMember}
                    onClose={() => setIsViewingCard(false)}
                  />
                </div>
              ) : (
                <>
                  {/* Top Profile Summary */}
                  <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start p-5 rounded-2xl bg-gradient-to-r from-orange-50/50 via-amber-50/40 to-blue-50/40 border border-amber-200/80">
                    <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-amber-400 bg-white shrink-0 shadow-md">
                      {activeMember.photoUrl ? (
                        <img
                          src={activeMember.photoUrl}
                          alt={activeMember.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                          No Photo
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-xl font-black text-slate-900">
                          {activeMember.fullName}
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {activeMember.id}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-medium space-x-2">
                        <span>Country: {activeMember.country}</span>
                        <span>·</span>
                        <span>Registered: {new Date(activeMember.registeredAt).toLocaleDateString()}</span>
                      </div>

                      <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <button
                          onClick={() => handleOpenWhatsAppChat(activeMember)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>WhatsApp {activeMember.whatsappNumber}</span>
                        </button>

                        <button
                          onClick={() => setIsViewingCard(true)}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-600" />
                          <span>View / Print ID Card</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dossier Detail Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl border border-slate-200 space-y-1 bg-slate-50/50 sm:col-span-2">
                      <span className="text-slate-400 uppercase text-[10px] tracking-wider block font-bold">
                        Agency / Agent Name (home country)
                      </span>
                      <div className="font-extrabold text-slate-900 text-sm">
                        {activeMember.agentOrAgencyName}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 uppercase text-[10px] tracking-wider block font-bold">
                        Arrival Date in Armenia
                      </span>
                      <div className="font-bold text-slate-900 font-mono">
                        {activeMember.arrivalDateInArmenia}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 uppercase text-[10px] tracking-wider block font-bold">
                        Home Country
                      </span>
                      <div className="font-bold text-slate-900">
                        {activeMember.country}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 uppercase text-[10px] tracking-wider block font-bold">
                        Official WhatsApp
                      </span>
                      <div className="font-bold text-slate-900 font-mono">
                        {activeMember.whatsappCountryCode} {activeMember.whatsappNumber}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 uppercase text-[10px] tracking-wider block font-bold">
                        Registration Checksum (SHA-256)
                      </span>
                      <div className="font-mono text-slate-600 break-all text-[10px]">
                        {activeMember.checksum || 'VERIFIED-INDO-ARMENIA'}
                      </div>
                    </div>
                  </div>

                  {/* Verification Status & Admin Internal Notes */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Verification Status
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleStatusChange('approved')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                            activeMember.verificationStatus === 'approved'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Approved
                        </button>
                        <button
                          onClick={() => handleStatusChange('pending')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                            activeMember.verificationStatus === 'pending'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Pending Review
                        </button>
                        <button
                          onClick={() => handleStatusChange('flagged')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                            activeMember.verificationStatus === 'flagged'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Flagged
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Admin Internal Notes / Community Coordination
                      </label>
                      <textarea
                        rows={2}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about visa assistance, community records..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <div className="mt-1 flex justify-end">
                        <button
                          onClick={handleSaveNotes}
                          className="px-3.5 py-1 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                onClick={() => handleDeleteMember(activeMember.id)}
                className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <button
                onClick={() => setActiveMember(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Backup Modal */}
      <CloudBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        members={members}
        onMembersRestored={onMembersUpdated}
      />

      {/* Google Sheet Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
        members={members}
      />

      {/* Admin Emergency SOS Popup Modal with Siren */}
      <AdminSosPopupModal
        alert={activeSosModalAlert}
        onResolve={handleResolveSos}
        onDismiss={() => setActiveSosModalAlert(null)}
      />
    </div>
  );
};
