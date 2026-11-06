import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import { CloseIcon } from '../common/Icons';

export const MpinModal: React.FC = () => {
  const { isMpinModalOpen, closeMpinModal, completeMpinClaim } = useApp();
  const [mpin, setMpin] = useState<string>('');

  useEffect(() => {
    if (isMpinModalOpen) {
      setMpin('');
    }
  }, [isMpinModalOpen]);

  const handleDigit = useCallback(
    (digit: string) => {
      setMpin((prev) => {
        if (prev.length < 4) {
          const next = prev + digit;
          if (next.length === 4) {
            setTimeout(() => {
              completeMpinClaim();
            }, 300);
          }
          return next;
        }
        return prev;
      });
    },
    [completeMpinClaim]
  );

  const handleDelete = useCallback(() => {
    setMpin((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  if (!isMpinModalOpen) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isMpinModalOpen}
      onRequestClose={closeMpinModal}
    >
      <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center px-0 sm:px-4">
        <View className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
          <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4 sm:hidden" />

          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-gray-900">
                Authorize Release
              </Text>
              <Text className="text-xs text-gray-500">
                Enter your 4-digit MPIN to confirm handover
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeMpinModal}
              className="p-1.5 rounded-full bg-gray-100"
            >
              <CloseIcon size={18} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {/* 4 MPIN Indicators */}
          <View className="flex-row items-center justify-center gap-4 py-5">
            {[0, 1, 2, 3].map((idx) => (
              <View
                key={idx}
                className={`w-4 h-4 rounded-full ${
                  idx < mpin.length ? 'bg-[#215cd4]' : 'bg-gray-200'
                }`}
              />
            ))}
          </View>

          {/* Keypad */}
          <View className="mt-2">
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['CLEAR', '0', '⌫'],
            ].map((row, rIdx) => (
              <View key={rIdx} className="flex-row justify-between mb-2.5">
                {row.map((btn) => (
                  <TouchableOpacity
                    key={btn}
                    onPress={() => {
                      if (btn === 'CLEAR') setMpin('');
                      else if (btn === '⌫') handleDelete();
                      else handleDigit(btn);
                    }}
                    className={`flex-1 mx-1.5 h-12 rounded-2xl items-center justify-center ${
                      btn === 'CLEAR' || btn === '⌫'
                        ? 'bg-gray-100'
                        : 'bg-gray-50 border border-gray-200/80 active:bg-blue-50'
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        btn === 'CLEAR' || btn === '⌫'
                          ? 'text-xs text-gray-600'
                          : 'text-xl text-gray-900'
                      }`}
                    >
                      {btn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

