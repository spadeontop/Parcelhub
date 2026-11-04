import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../layout/BottomNav';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface PolicyItem {
  id: string;
  title: string;
  answer: string;
}

const FAQS_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How does ParcelHub COD Escrow work?',
    answer:
      'When ordering online (Shopee, Lazada, TikTok), you deposit your COD cash advance at Lily’s Catering Hub beforehand. When the courier arrives, counter staff pays on your behalf and safely secures your package in the hub until you pick it up.',
  },
  {
    id: 'faq-2',
    question: 'What if my cash deposit is more than the parcel price?',
    answer:
      'Any extra deposit is tracked automatically in your account ledger. When you pick up your package at Lily’s Catering Hub, our counter staff returns your exact change in cash together with your parcel.',
  },
  {
    id: 'faq-3',
    question: 'How do I claim my parcel once it arrives?',
    answer:
      'Once your order shows "Ready to Claim", visit Lily’s Catering Hub. Tap "Initiate Claim" in the app to open your pickup window, and present your QR code or pickup key (e.g. PH-402-5544) to counter staff to complete the handoff.',
  },
  {
    id: 'faq-4',
    question: 'Why is there a 5-minute timer after starting a claim?',
    answer:
      'The 5-minute timer ensures you are physically present at the counter before your parcel is unlocked from storage. If the timer runs out before staff completes the handoff, you can easily tap to renew it right at the counter.',
  },
  {
    id: 'faq-5',
    question: 'What is my 4-digit MPIN and what is it used for?',
    answer:
      'Your MPIN is a personal 4-digit security code created during registration. It is used to quickly and securely log into your account on your device without having to type your password every time.',
  },
  {
    id: 'faq-6',
    question: 'How do I submit an order from Shopee or Lazada?',
    answer:
      'Tap "+ Create Order" on the home screen and upload a screenshot of your shopping receipt. ParcelHub reads the price, COD fee, and tracking number for you to review and confirm.',
  },
  {
    id: 'faq-7',
    question: 'How do I check if my package was received undamaged?',
    answer:
      'Staff photographs every package and inspects the shipping label as soon as the courier arrives. You can view this Proof of Delivery photo directly in your Order Details before claiming.',
  },
];

const POLICIES_DATA: PolicyItem[] = [
  {
    id: 'policy-1',
    title: 'Exact Courier Payment Rule',
    answer:
      'The amount paid to the courier matches the exact price on your order receipt. Any excess cash deposit is safely kept and returned to you as change when you pick up your parcel.',
  },
  {
    id: 'policy-2',
    title: 'Cash On Delivery (COD) Ready',
    answer:
      'Cash is deposited at Lily’s Catering Hub counter in advance so our staff can receive and pay for your delivery the moment the courier arrives, preventing missed deliveries.',
  },
  {
    id: 'policy-3',
    title: 'Safe Cash Custody',
    answer:
      'Your exact cash deposit is safely locked in our counter cash register, and any change due is handed over in cash alongside your package upon pickup.',
  },
  {
    id: 'policy-4',
    title: 'Pickup Key & QR Verification',
    answer:
      'Parcels are only released at the counter when you initiate claim in your app and present your unique Alphanumeric Pickup Key (e.g. PH-402-5544) or QR code. The counter terminal stays locked until claim is initiated.',
  },
  {
    id: 'policy-5',
    title: 'Proof of Delivery (Photo Inspection)',
    answer:
      'Staff verifies the shipping label and captures a clear package photo before courier payment is finalized. You can view this proof in your app before claiming.',
  },
  {
    id: 'policy-6',
    title: '5-Day Free Counter Storage',
    answer:
      'Parcels are safely kept in our secure counter shelves for up to 5 days after delivery. You will receive helpful pickup reminders before storage expires.',
  },
];

export interface FaqScreenProps {
  onBack?: () => void;
  initialTab?: 'faq' | 'policies';
}

export const FaqScreen: React.FC<FaqScreenProps> = ({ onBack, initialTab = 'faq' }) => {
  const { navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState<'faq' | 'policies'>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>('policy-1');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigateTo('home');
    }
  };

  // Filter FAQs based on query
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FAQS_DATA;
    return FAQS_DATA.filter(
      (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filter Policies based on query
  const filteredPolicies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return POLICIES_DATA;
    return POLICIES_DATA.filter(
      (p) => p.title.toLowerCase().includes(q) || p.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  const togglePolicy = (id: string) => {
    setExpandedPolicyId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none text-gray-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pb-3 shrink-0 border-b border-gray-100 -mx-5 px-5 -mt-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back to Home"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Help &amp; FAQs</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b780]" />
                <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                  Lily's Catering Hub
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-3.5 relative">
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or policies..."
            className="w-full h-10 pl-9 pr-8 bg-[#f8f9fc] border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#215cd4] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Segmented Control */}
        <div className="grid grid-cols-2 p-1 bg-[#f0f3f8] rounded-2xl mt-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'faq'
                ? 'font-bold bg-white text-[#215cd4] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Frequently Asked
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'policies'
                ? 'font-bold bg-white text-[#215cd4] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Counter Policies
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-4 space-y-4 bg-white max-w-xl mx-auto w-full">
        {activeTab === 'faq' ? (
          /* ==================== FAQ ACCORDION TAB ==================== */
          <div className="space-y-2.5">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-sm font-semibold text-gray-700">No matching questions</p>
                <p className="text-xs text-gray-500 mt-1">Try searching with simpler terms or keywords.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs text-[#215cd4] font-semibold hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => toggleFaq(faq.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleFaq(faq.id);
                      }
                    }}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
                      isOpen
                        ? 'border-[#dbe5f9] bg-white shadow-[0_2px_8px_-2px_rgba(33,92,212,0.08)]'
                        : 'bg-[#f8f8f8] border-gray-200/70 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13.5px] font-bold text-gray-900 leading-snug">
                        {faq.question}
                      </span>
                      <span
                        className={`inline-block text-base font-bold transition-transform duration-200 shrink-0 select-none ${
                          isOpen ? 'rotate-90 text-[#215cd4]' : 'text-gray-400'
                        }`}
                      >
                        &gt;
                      </span>
                    </div>
                    {isOpen && (
                      <div className="mt-2.5 pt-2.5 border-t border-gray-200/60">
                        <p className="text-[12.5px] text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ==================== POLICIES TAB ==================== */
          <div className="space-y-2.5">
            {filteredPolicies.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-sm font-semibold text-gray-700">No matching counter policies</p>
                <p className="text-xs text-gray-500 mt-1">Try another search keyword.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs text-[#215cd4] font-semibold hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredPolicies.map((policy) => {
                const isOpen = expandedPolicyId === policy.id;
                return (
                  <div
                    key={policy.id}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => togglePolicy(policy.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        togglePolicy(policy.id);
                      }
                    }}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
                      isOpen
                        ? 'border-[#dbe5f9] bg-white shadow-[0_2px_8px_-2px_rgba(33,92,212,0.08)]'
                        : 'bg-[#f8f8f8] border-gray-200/70 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13.5px] font-bold text-gray-900 leading-snug">
                        {policy.title}
                      </span>
                      <span
                        className={`inline-block text-base font-bold transition-transform duration-200 shrink-0 select-none ${
                          isOpen ? 'rotate-90 text-[#215cd4]' : 'text-gray-400'
                        }`}
                      >
                        &gt;
                      </span>
                    </div>
                    {isOpen && (
                      <div className="mt-2.5 pt-2.5 border-t border-gray-200/60">
                        <p className="text-[12.5px] text-gray-600 leading-relaxed">{policy.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Counter Info Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-1">
          <p className="text-xs font-semibold text-gray-700">Still have questions?</p>
          <p className="text-[11px] text-gray-500">
            Visit Lily’s Catering Hub counter at Yati, Liloan or ask our on-duty staff.
          </p>
          <p className="text-[10px] text-gray-400 font-mono mt-1">Open Mon - Sat • 8:00 AM - 6:00 PM</p>
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav activeTab="faq" />
    </div>
  );
};

export default FaqScreen;
