import React from 'react';
import {
  OrderConfirmationCard,
  OrderConfirmationCardProps,
} from './OrderConfirmationCard';

export type OrderConfirmationCheckboxProps = OrderConfirmationCardProps;

export const OrderConfirmationCheckbox: React.FC<OrderConfirmationCheckboxProps> = (props) => {
  return <OrderConfirmationCard {...props} />;
};
