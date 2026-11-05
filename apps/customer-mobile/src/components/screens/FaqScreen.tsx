import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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

interface AccordionCardProps {
  title: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionCard: React.FC<AccordionCardProps> = ({
  title,
  answer,
  isOpen,
  onToggle,
}) => {
  const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      className={`p-3.5 rounded-2xl border ${
        isOpen
          ? 'border-[#dbe5f9] bg-white shadow-sm'
          : 'bg-[#f8f8f8] border-gray-200/70'
      }`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-[13.5px] font-bold text-gray-900 leading-snug">
          {title}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Text
            className={`text-base font-bold shrink-0 ${
              isOpen ? 'text-[#215cd4]' : 'text-gray-400'
            }`}
          >
            &gt;
          </Text>
        </Animated.View>
      </View>
      {isOpen && (
        <View className="mt-2.5 pt-2.5 border-t border-gray-200/60">
          <Text className="text-[12.5px] text-gray-600 leading-relaxed">
            {answer}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

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
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2">
      {/* Top Header */}
      <View className="pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 19l-7-7 7-7"
                  stroke="#374151"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <View>
              <Text className="text-lg font-bold text-gray-900 leading-tight">Help & FAQs</Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-[#10b780]" />
                <Text className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                  Lily's Catering Hub
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View className="mt-3.5 relative justify-center">
          <View pointerEvents="none" className="absolute left-3.5 z-10">
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search questions or policies..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="w-full h-10 pl-9 pr-9 bg-[#f8f9fc] border border-gray-200 rounded-xl text-[13px] text-gray-900"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSearchQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="absolute right-3 z-10 p-1"
            >
              <Text className="text-gray-400 text-xs font-bold">✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented Control */}
        <View className="flex-row p-1 bg-[#f0f3f8] rounded-2xl mt-3">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('faq')}
            accessibilityRole="button"
            accessibilityLabel="Frequently Asked"
            className={`flex-1 py-2 items-center justify-center rounded-xl ${
              activeTab === 'faq' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-xs ${
                activeTab === 'faq' ? 'font-bold text-[#215cd4]' : 'font-semibold text-gray-600'
              }`}
            >
              Frequently Asked
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('policies')}
            accessibilityRole="button"
            accessibilityLabel="Counter Policies"
            className={`flex-1 py-2 items-center justify-center rounded-xl ${
              activeTab === 'policies' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-xs ${
                activeTab === 'policies' ? 'font-bold text-[#215cd4]' : 'font-semibold text-gray-600'
              }`}
            >
              Counter Policies
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        className="flex-1 py-3"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {activeTab === 'faq' ? (
          /* ==================== FAQ ACCORDION TAB ==================== */
          <View className="gap-2.5">
            {filteredFaqs.length === 0 ? (
              <View className="items-center py-10 px-4">
                <Text className="text-sm font-semibold text-gray-700">No matching questions</Text>
                <Text className="text-xs text-gray-500 mt-1">Try searching with simpler terms or keywords.</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSearchQuery('')}
                  className="mt-3"
                >
                  <Text className="text-xs text-[#215cd4] font-semibold">Clear search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredFaqs.map((faq) => (
                <AccordionCard
                  key={faq.id}
                  title={faq.question}
                  answer={faq.answer}
                  isOpen={expandedFaqId === faq.id}
                  onToggle={() => toggleFaq(faq.id)}
                />
              ))
            )}
          </View>
        ) : (
          /* ==================== POLICIES TAB ==================== */
          <View className="gap-2.5">
            {filteredPolicies.length === 0 ? (
              <View className="items-center py-10 px-4">
                <Text className="text-sm font-semibold text-gray-700">No matching counter policies</Text>
                <Text className="text-xs text-gray-500 mt-1">Try another search keyword.</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSearchQuery('')}
                  className="mt-3"
                >
                  <Text className="text-xs text-[#215cd4] font-semibold">Clear search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredPolicies.map((policy) => (
                <AccordionCard
                  key={policy.id}
                  title={policy.title}
                  answer={policy.answer}
                  isOpen={expandedPolicyId === policy.id}
                  onToggle={() => togglePolicy(policy.id)}
                />
              ))
            )}
          </View>
        )}

        {/* Counter Info Footer */}
        <View className="mt-6 pt-4 border-t border-gray-100 items-center">
          <Text className="text-xs font-semibold text-gray-700">Still have questions?</Text>
          <Text className="text-[11px] text-gray-500 mt-1 text-center">
            Visit Lily’s Catering Hub counter at Yati, Liloan or ask our on-duty staff.
          </Text>
          <Text className="text-[10px] text-gray-400 font-mono mt-1">
            Open Mon - Sat • 8:00 AM - 6:00 PM
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav />
    </View>
  );
};

export default FaqScreen;
