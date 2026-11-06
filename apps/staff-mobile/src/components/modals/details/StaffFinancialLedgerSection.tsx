import React from 'react';
import { View, Text } from 'react-native';
import { StaffOrder } from '../../../types';
import { DollarSign, CheckCircle, Clock } from '../../common/Icons';

interface StaffFinancialLedgerSectionProps {
  order: StaffOrder;
}

export const StaffFinancialLedgerSection: React.FC<StaffFinancialLedgerSectionProps> = ({ order }) => {
  return (
    <View className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 mb-3 space-y-2.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Financial Ledger
        </Text>
        <DollarSign size={14} color="#34d399" />
      </View>

      <View className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 space-y-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-slate-400">Order Amount / Fee</Text>
          <Text className="text-xs font-mono font-bold text-white">₱{(order.amountToPay || 0).toLocaleString()}</Text>
        </View>

        {typeof order.amountReceived === 'number' && (
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-slate-400">Amount Received</Text>
            <Text className="text-xs font-mono font-bold text-emerald-400">₱{order.amountReceived.toLocaleString()}</Text>
          </View>
        )}

        {typeof order.change === 'number' && order.change > 0 && (
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-slate-400">Change Returned</Text>
            <Text className="text-xs font-mono font-bold text-amber-400">₱{order.change.toLocaleString()}</Text>
          </View>
        )}

        <View className="pt-2 border-t border-slate-800 flex-row justify-between items-center">
          <Text className="text-xs text-slate-400">Courier Payout</Text>
          <View className="flex-row items-center gap-1.5">
            {order.courierPaid ? (
              <>
                <CheckCircle size={13} color="#34d399" />
                <Text className="text-xs font-semibold text-emerald-400">
                  Paid {order.courierPaidByName ? `by ${order.courierPaidByName}` : 'to Courier'}
                </Text>
              </>
            ) : (
              <>
                <Clock size={13} color="#f59e0b" />
                <Text className="text-xs font-medium text-amber-400">Awaiting Arrival / Unpaid</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
