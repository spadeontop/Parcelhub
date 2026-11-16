import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { useV1 } from '../../v1/context/V1Context';
import { AppHeader } from '../layout/AppHeader';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'I placed an order. What do I do next?',
    answer:
      'Check your confirmation email for your order details. You can follow its progress in My orders. We’ll let you know when it’s ready for the next step.',
  },
  {
    id: 'faq-2',
    question: 'Where can I track my order?',
    answer:
      'You can track your package progress in real-time under the My Orders or Transactions tab. When it arrives at Lily’s Catering Hub, the status will update to Ready for Release.',
  },
  {
    id: 'faq-3',
    question: 'Can I change or cancel my order?',
    answer:
      'You can cancel or update an order as long as the counter staff has not yet accepted or finalized courier payment. Open your Order Details to check current cancellation options.',
  },
  {
    id: 'faq-4',
    question: 'What if there’s a problem with my order?',
    answer:
      'Open your order and choose Get help. Tell us what happened and include a photo if it helps, so our support team can review it.',
  },
  {
    id: 'faq-5',
    question: 'How do refunds work?',
    answer:
      'If your parcel is rejected or cancelled before counter payment, your deposit is safely held for withdrawal or credited immediately. You can collect your cash at Lily’s Catering Hub counter.',
  },
  {
    id: 'faq-6',
    question: 'How can I contact support?',
    answer:
      'You can reach our support team directly via the app help options or visit our staff counter at Lily’s Catering Hub (Yati, Liloan) Monday through Saturday from 8:00 AM to 6:00 PM.',
  },
];

export interface FaqScreenProps {
  onBack?: () => void;
}

export const FaqScreen: React.FC<FaqScreenProps> = ({ onBack }) => {
  const { navigateTo } = useV1();
  // Default: all dropdowns closed
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigateTo('home');
    }
  };

  const toggleFaq = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#2563eb' }} className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Header component from Complete Details (AppHeader) */}
      <AppHeader
        title="Frequently Asked Questions"
        subtitle="Help Center & Answers"
        showBackButton
        centerTitle
        onBack={handleBack}
      />

      {/* FAQ Cards Sheet matching Figma node 1309:314 */}
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
            paddingTop: 24,
            paddingHorizontal: 16,
            paddingBottom: 32,
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
              Answers to your order questions.
            </Text>
          </View>

          {/* Accordion FAQ Cards List */}
          {FAQS_DATA.map((faq) => {
            const isOpen = Boolean(expandedIds[faq.id]);
            return (
              <TouchableOpacity
                key={faq.id}
                activeOpacity={0.8}
                onPress={() => toggleFaq(faq.id)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: 18,
                  gap: isOpen ? 14 : 0,
                  shadowColor: '#215cd4',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                  elevation: 1,
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
                  <Text
                    style={{
                      flex: 1,
                      fontWeight: '700',
                      fontSize: 15,
                      lineHeight: 21,
                      color: isOpen ? '#215cd4' : '#24364b',
                    }}
                  >
                    {faq.question}
                  </Text>
                  {/* Chevron Icon (Up for collapse, Down for expand) */}
                  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                    {isOpen ? (
                      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                        <Path
                          d="M5 12.5L10 7.5L15 12.5"
                          stroke="#215CD4"
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    ) : (
                      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                        <Path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="#64748B"
                          strokeWidth={1.8}
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
                    {/* Answer divider */}
                    <View style={{ height: 1, backgroundColor: '#e7edf4', width: '100%' }} />
                    <Text
                      style={{
                        fontWeight: '400',
                        fontSize: 14,
                        lineHeight: 21,
                        color: '#64748b',
                      }}
                    >
                      {faq.answer}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default FaqScreen;
