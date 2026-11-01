import type { OrderStatus } from '@/api/types';

export const ORDER_STATUS: Record<OrderStatus, string> = {
  PLACED: 'Waiting for the farmer',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const FARM_ORDER_STATUS: Record<OrderStatus, string> = {
  ...ORDER_STATUS,
  PLACED: 'New order',
};
