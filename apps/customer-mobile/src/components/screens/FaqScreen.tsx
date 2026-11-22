import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { useV1 } from '../../v1/context/V1Context';
import { AppHeader } from '../layout/AppHeader';

export type FaqCategory = 'All' | 'Ordering' | 'Payment' | 'Claiming' | 'Safety & Account';

export interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'All'>;
  question: string;
  answer: string;
}

const FAQ_CATEGORIES: readonly FaqCategory[] = [
  'All',
  'Ordering',
  'Payment',
  'Claiming',
  'Safety & Account',
];

const FAQS_DATA: readonly FaqItem[] = [
  // Ordering Flow
  {
    id: 'faq-ord-1',
    category: 'Ordering',
    question: 'How do I create a new order in ParcelHub?',
    answer:
      'Tap "+ Create Order" on your Home screen. First, upload a screenshot of your checkout confirmation from your shopping app (Shopee, Lazada, TikTok Shop). Next, enter your tracking number, product name, and item price, then tap "Confirm Order Details" to initialize your order.',
  },
  {
    id: 'faq-ord-2',
    category: 'Ordering',
    question: 'Why do I need to attach a screenshot of my receipt?',
    answer:
      'The receipt screenshot acts as visual proof of your package contents and declared value. Our system automatically compresses it into an optimized WebP format under 110KB for fast verification by Lily’s Catering Hub staff when your courier arrives.',
  },
  {
    id: 'faq-ord-3',
    category: 'Ordering',
    question: 'Can I change or update my order after submitting?',
    answer:
      'You can update your order details as long as the counter staff has not yet accepted payment. Once counter payment is recorded and the order enters "Awaiting Parcel", details are locked for security.',
  },
  {
    id: 'faq-ord-4',
    category: 'Ordering',
    question: 'What shopping platforms are supported?',
    answer:
      'ParcelHub supports deliveries from all major e-commerce platforms including Shopee, Lazada, TikTok Shop, and independent couriers (J&T Express, Flash Express, SPX, LBC). Just make sure you provide a valid tracking number.',
  },

  // Payment Flow
  {
    id: 'faq-pay-1',
    category: 'Payment',
    question: 'Why does my order say "Payment Required"?',
    answer:
      'When you create an order, it is marked as "Payment Required" until you deposit the courier cash at Lily’s Catering Hub counter. Once our staff receives and verifies your payment, the status advances to "Awaiting Parcel".',
  },
  {
    id: 'faq-pay-2',
    category: 'Payment',
    question: 'Where and how do I complete my counter payment?',
    answer:
      'Head to Lily’s Catering Hub counter in Yati, Liloan, Cebu. Show your Ticket Code or tracking ID to the staff and hand over the cash deposit. Staff will verify it on their terminal in real-time.',
  },
  {
    id: 'faq-pay-3',
    category: 'Payment',
    question: 'What if change is owed from my cash payment?',
    answer:
      'If your cash deposit was greater than the exact courier amount, the difference is tracked as "Change" on your Order Details screen. Staff will hand you your change when you pick up your parcel.',
  },
  {
    id: 'faq-pay-4',
    category: 'Payment',
    question: 'What happens if a parcel is cancelled before courier delivery?',
    answer:
      'If a parcel is cancelled or returned before courier payment is finalized, your counter deposit remains safely held for collection or credited back at Lily’s Catering Hub counter.',
  },

  // Claiming Flow
  {
    id: 'faq-clm-1',
    category: 'Claiming',
    question: 'How do I know when my parcel is ready for pickup?',
    answer:
      'When the courier drops off your package at Lily’s Catering Hub, our staff inspects the pouch and logs it into the system. You will receive an immediate update in your Activity Updates inbox, and the status changes to "Ready to Claim".',
  },
  {
    id: 'faq-clm-2',
    category: 'Claiming',
    question: 'When should I tap the "Initiate Claim" button?',
    answer:
      'Only tap "Initiate Claim" when you are physically standing at the counter at Lily’s Catering Hub! Initiating a claim unlocks a live 5-minute security countdown for staff to retrieve and scan your package.',
  },
  {
    id: 'faq-clm-3',
    category: 'Claiming',
    question: 'What happens if the 5-minute pickup timer expires?',
    answer:
      'If the timer runs out before staff completes the scan, your parcel remains safely held at the hub. Simply tap the "Refresh Release" button on your screen to start a fresh 5-minute claim window.',
  },
  {
    id: 'faq-clm-4',
    category: 'Claiming',
    question: 'How do I present my QR pickup pass to staff?',
    answer:
      'Show your "Ready for Release" screen or open the "Generated QR" screen to let staff scan your code. You can also tap "Save Pass to Gallery" to save an offline image of your QR pass directly to your phone’s photo album.',
  },
  {
    id: 'faq-clm-5',
    category: 'Claiming',
    question: 'What is my Ticket Code (e.g. 941-53N)?',
    answer:
      'Your Ticket Code is a short alphanumeric code assigned to your parcel. If counter staff’s barcode scanner is busy, they can simply type your 6-character Ticket Code into their terminal to release your order.',
  },

  // Safety & Account Flow
  {
    id: 'faq-sec-1',
    category: 'Safety & Account',
    question: 'How do I check if my parcel arrived safely and intact?',
    answer:
      'On your Order Details screen, tap "View Proof of Delivery". This displays the verification photo taken by hub staff upon courier handover, allowing you to confirm that the pouch seal and parcel label are in good condition before claiming.',
  },
  {
    id: 'faq-sec-2',
    category: 'Safety & Account',
    question: 'What is my 4-digit MPIN used for?',
    answer:
      'Your 4-digit MPIN secures your account session. It allows you to unlock the app and authorize pickup passes quickly without entering your full email and password each time.',
  },
  {
    id: 'faq-sec-3',
    category: 'Safety & Account',
    question: 'Where is Lily’s Catering Hub located and what are the hours?',
    answer:
      'Lily’s Catering Hub is located in Yati, Liloan, Cebu. Counter service runs Monday through Saturday from 8:00 AM to 6:00 PM. Note that parcel claims cannot be initiated when the hub is closed.',
  },
  {
    id: 'faq-sec-4',
    category: 'Safety & Account',
    question: 'What should I do if my account is suspended or blacklisted?',
    answer:
      'If your account is suspended, a notice will appear when attempting to create an order. Please visit our staff counter at Lily’s Catering Hub with a valid government ID or contact support to resolve any account inquiries.',
  },
];

export interface FaqScreenProps {
  onBack?: () => void;
}

export const FaqScreen: React.FC<FaqScreenProps> = ({ onBack }) => {
  const { navigateTo, goBack } = useV1();
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('All');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  const toggleFaq = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = useMemo(() => {
    if (selectedCategory === 'All') return FAQS_DATA;
    return FAQS_DATA.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <View style={{ flex: 1, backgroundColor: '#2563eb' }} className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Header component */}
      <AppHeader
        title="Frequently Asked Questions"
        subtitle="Help Center & Answers"
        showBackButton
        centerTitle
        onBack={handleBack}
      />

      {/* Main Sheet */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#f1f5f9',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: 'hidden',
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 20,
            paddingHorizontal: 16,
            paddingBottom: 40,
            gap: 14,
          }}
        >
          {/* FAQ introduction */}
          <View style={{ gap: 4, width: '100%' }}>
            <Text
              style={{
                fontWeight: '700',
                fontSize: 22,
                lineHeight: 28,
                color: '#24364b',
              }}
            >
              How can we help?
            </Text>
            <Text
              style={{
                fontWeight: '400',
                fontSize: 14,
                lineHeight: 20,
                color: '#64748b',
              }}
            >
              Learn about order creation, payments, pickup passes, and counter claims.
            </Text>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            {FAQ_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 9999,
                    backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                    borderWidth: 1,
                    borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? '700' : '600',
                      color: isSelected ? '#ffffff' : '#475569',
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Accordion FAQ Cards List */}
          {filteredFaqs.map((faq) => {
            const isOpen = Boolean(expandedIds[faq.id]);
            return (
              <TouchableOpacity
                key={faq.id}
                activeOpacity={0.8}
                onPress={() => toggleFaq(faq.id)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  gap: isOpen ? 12 : 0,
                  shadowColor: '#215cd4',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: '#f1f5f9',
                }}
              >
                {/* Question Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    width: '100%',
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          backgroundColor: '#eff6ff',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: '#2563eb',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          {faq.category}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontWeight: '700',
                        fontSize: 14,
                        lineHeight: 20,
                        color: isOpen ? '#2563eb' : '#1e293b',
                      }}
                    >
                      {faq.question}
                    </Text>
                  </View>

                  {/* Chevron Icon (Up for collapse, Down for expand) */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                      backgroundColor: isOpen ? '#eff6ff' : '#f8fafc',
                    }}
                  >
                    {isOpen ? (
                      <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
                        <Path
                          d="M5 12.5L10 7.5L15 12.5"
                          stroke="#2563eb"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    ) : (
                      <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
                        <Path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="#64748b"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </View>
                </View>

                {/* Expanded Answer Content */}
                {isOpen && (
                  <>
                    <View style={{ height: 1, backgroundColor: '#f1f5f9', width: '100%' }} />
                    <Text
                      style={{
                        fontWeight: '400',
                        fontSize: 13.5,
                        lineHeight: 21,
                        color: '#475569',
                      }}
                    >
                      {faq.answer}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Hub Counter Info Footer Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              marginTop: 10,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#10b981',
                }}
              />
              <Text style={{ fontSize: 12, fontFamily: 'GoogleSans-Bold', fontWeight: '700', color: '#1e293b' }}>
                Lily’s Catering Hub Counter
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: 'GoogleSans-Regular', color: '#64748b', lineHeight: 18 }}>
              Location: Yati, Liloan, Cebu{'\n'}
              Hours: Monday to Saturday, 8:00 AM – 6:00 PM{'\n'}
              Closed on Sundays and Hub Holidays
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default FaqScreen;
