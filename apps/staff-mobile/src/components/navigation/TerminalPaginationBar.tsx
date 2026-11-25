import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface TerminalPaginationBarProps {
  rangeDisplay: string;
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  onPageChange: (page: number) => void;
}

export const TerminalPaginationBar: React.FC<TerminalPaginationBarProps> = ({
  rangeDisplay,
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
}) => {
  return (
    <View
      style={{
        zIndex: 10,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
      }}
      className="bg-[#F8FAFC] px-5 pt-2.5 pb-6 items-center"
    >
      <Text className="text-[12px] font-medium text-[#475569] mb-2">
        {rangeDisplay}
      </Text>

      <View className="flex-row items-center justify-center gap-2">
        <TouchableOpacity
          onPress={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          activeOpacity={0.7}
          className={`h-[40px] px-4 rounded-[12px] items-center justify-center ${
            currentPage <= 1 ? 'bg-[#F1F5F9]' : 'bg-white border border-[#E2E8F0]'
          }`}
        >
          <Text
            className={`text-[12px] font-medium ${
              currentPage <= 1 ? 'text-[#94A3B8]' : 'text-[#475569]'
            }`}
          >
            Prev
          </Text>
        </TouchableOpacity>

        {pageNumbers.map((pageNum) => {
          const isActive = currentPage === pageNum;
          return (
            <TouchableOpacity
              key={`page-${pageNum}`}
              onPress={() => onPageChange(pageNum)}
              activeOpacity={0.8}
              className={`w-10 h-10 rounded-[12px] items-center justify-center ${
                isActive ? 'bg-[#2563EB]' : 'bg-white border border-[#E2E8F0]'
              }`}
            >
              <Text
                className={`text-[12px] font-medium ${
                  isActive ? 'text-white' : 'text-[#475569]'
                }`}
              >
                {pageNum}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          activeOpacity={0.7}
          className={`h-[40px] px-4 rounded-[12px] items-center justify-center ${
            currentPage >= totalPages ? 'bg-[#F1F5F9]' : 'bg-white border border-[#E2E8F0]'
          }`}
        >
          <Text
            className={`text-[12px] font-medium ${
              currentPage >= totalPages ? 'text-[#94A3B8]' : 'text-[#475569]'
            }`}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
