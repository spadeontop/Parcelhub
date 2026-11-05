import React from 'react';
import { Order, StaffFilter } from '../../types';
import { StaffOrderCard } from './StaffOrderCard';
import { StaffEmptyState } from '../common/StaffEmptyState';
import { StaffCardSkeleton } from '../common/StaffLoadingIndicator';

export interface StaffOrdersListProps {
  orders: Order[];
  searchQuery: string;
  crossTabMatches: Order[];
  onOpenDetails: (order: Order) => void;
  onSelectFilter: (filter: StaffFilter) => void;
  getOrderFee: (order: Order) => number;
  isLoading?: boolean;
}

export const StaffOrdersList: React.FC<StaffOrdersListProps> = React.memo(({
  orders,
  searchQuery,
  crossTabMatches,
  onOpenDetails,
  onSelectFilter,
  getOrderFee,
  isLoading = false,
}) => {
  return (
    <section className="terminal-cards-area flex-1 overflow-y-auto p-4 space-y-3 relative min-h-[380px]">
      <div id="staff-orders-list" className="space-y-3 pb-28">
        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading orders">
            <StaffCardSkeleton />
            <StaffCardSkeleton />
            <StaffCardSkeleton />
          </div>
        ) : orders.length === 0 ? (
          <StaffEmptyState
            searchQuery={searchQuery}
            crossTabMatches={crossTabMatches}
            onSelectFilter={onSelectFilter}
          />
        ) : (
          orders.map((order) => (
            <StaffOrderCard
              key={order.id}
              order={order}
              fee={getOrderFee(order)}
              onOpenDetails={onOpenDetails}
            />
          ))
        )}
      </div>
    </section>
  );
});

StaffOrdersList.displayName = 'StaffOrdersList';
