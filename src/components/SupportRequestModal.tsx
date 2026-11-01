import React, { useState } from 'react';
import { Member } from '../types/member';
import {
  LifeBuoy,
  Phone,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  FileText,
  HeartPulse,
  GraduationCap,
  Home,
} from 'lucide-react';

interface SupportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
}

const SUPPORT_CATEGORIES = [
  { id: 'visa_legal', label: 'Visa, Residence & Legal Guidance', icon: FileText },
  { id: 'job_employment', label: 'Job Placement & Employment Help', icon: Briefcase },
  { id: 'medical_emergency', label: 'Medical & Healthcare Assistance', icon: HeartPulse },
  { id: 'student_academic', label: 'Student & University Support', icon: GraduationCap },
  { id: 'housing_stay', label: 'Housing & Accommodation Help', icon: Home },
  { id: 'consular_embassy', label: 'Consular & Embassy Affairs', icon: LifeBuoy },
];

export const SupportRequestModal: React.FC<SupportRequestModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(SUPPORT_CATEGORIES[0].id);
  const [supportMessage, setSupportMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSendViaWhatsApp = () => {
    const categoryObj = SUPPORT_CATEGORIES.find((c) => c.id === selectedCategory);
    const categoryName = categoryObj ? categoryObj.label : 'General Support';

    const text = encodeURIComponent(
      `*SUPPORT REQUEST - INDO ARMENIA LLC*\n\n` +
        `👤 *Member Name:* ${member.fullName}\n` +
        `🪪 *Member ID:* ${member.id}\n` +
        `🌍 *Home Country:* ${member.country}\n` +
        `📅 *Arrival in Armenia:* ${member.arrivalDateInArmenia}\n` +
        `🏢 *Agency / Agent:* ${member.agentOrAgencyName}\n` +
        `📱 *Member WhatsApp:* ${member.whatsappCountryCode} ${member.whatsappNumber}\n` +
        `🏢 *Office:* Maro Margaryan 14, Yerevan, Armenia\n\n` +
        `🆘 *Support Category:* ${categoryName}\n` +
        `📝 *Details:* ${supportMessage.trim() || 'Requesting community assistance & guidance.'}`
    );

    // Official Indo Armenia LLC Community Helpline
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    setIsSent(true);
  };

  const handleReset = () => {
    setIsSent(false);
    setSupportMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden relative text-left">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight text-white">
                Request For Community Support
              </h3>
              <p className="text-[11px] text-amber-200/90 font-medium">
                Indo Armenia LLC · Maro Margaryan 14, Yerevan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {isSent ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">Support Request Dispatched!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                  Your request has been prepared with Member ID <strong>{member.id}</strong>. Our Indo Armenia LLC community desk will respond promptly.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Member Identification Cardlet */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Registered Member
                  </span>
                  <span className="font-extrabold text-slate-900">{member.fullName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Member ID
                  </span>
                  <span className="font-mono font-bold text-amber-700">{member.id}</span>
                </div>
              </div>

              {/* Support Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Select Assistance Needed:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUPPORT_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span className="text-xs">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Details */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Describe what support you require:
                </label>
                <textarea
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Explain your situation or assistance needed (visa, work, housing, medical, legal)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-medium"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Submit Support Request via WhatsApp Desk</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5 font-medium">
                  Direct connection with Indo Armenia LLC community desk in Yerevan.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
