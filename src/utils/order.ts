import type { Order, OrderStatus } from '@/api/types';
import type { IconName, Tone } from '@/components/ui';

export const ORDER_STATUS: Record<OrderStatus, string> = {
  PLACED: 'Waiting for the farmer',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ORDER_TONE: Record<OrderStatus, Tone> = {
  PLACED: 'warning',
  CONFIRMED: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};

export const FARM_ORDER_STATUS: Record<OrderStatus, string> = {
  ...ORDER_STATUS,
  PLACED: 'New order',
};

export const ORDER_ICON: Record<OrderStatus, IconName> = {
  PLACED: 'hourglass-outline',
  CONFIRMED: 'checkmark-circle-outline',
  COMPLETED: 'checkmark-done-outline',
  CANCELLED: 'close-circle-outline',
};

// Order ids are UUIDs, so the start of one is enough for a person to quote
export const orderReference = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

export const orderItemsSummary = ({ items }: Pick<Order, 'items'>) =>
  `${items.length} ${items.length === 1 ? 'item' : 'items'}: ${items
    .map((item) => `${item.productName} ${item.quantity} ${item.unit}`)
    .join(', ')}`;
