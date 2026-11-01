import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { CART_KEY } from '@/api/cart';
import { api } from '@/api/client';
import { FARM_PRODUCTS_KEY } from '@/api/farmer';
import type { FulfilmentType, Order, OrderSlots, Paginated } from '@/api/types';
import { PRIVATE_KEY, useSession } from '@/auth/session';

const ORDERS_KEY = [PRIVATE_KEY, 'orders'];
const PAGE_SIZE = 20;

export const useSlots = () => {
  const { signedIn } = useSession();

  return useQuery({
    queryKey: [PRIVATE_KEY, 'slots'],
    queryFn: () => api<OrderSlots>('/orders/slots'),
    enabled: signedIn === true,
  });
};

export const useOrders = () => {
  const { signedIn } = useSession();

  return useInfiniteQuery({
    queryKey: [...ORDERS_KEY, 'list'],
    queryFn: ({ pageParam }) =>
      api<Paginated<Order>>('/orders', { query: { page: pageParam, limit: PAGE_SIZE } }),
    initialPageParam: 1,
    getNextPageParam: ({ page, limit, total }) => (page * limit < total ? page + 1 : undefined),
    enabled: signedIn === true,
  });
};

// Without a date the API answers for tomorrow, so delivery day needs one sent explicitly
export const useFarmOrders = (date: string | undefined) =>
  useInfiniteQuery({
    queryKey: [...ORDERS_KEY, 'farm', date],
    queryFn: ({ pageParam }) =>
      api<Paginated<Order>>('/orders/farmer', { query: { date, page: pageParam, limit: PAGE_SIZE } }),
    initialPageParam: 1,
    getNextPageParam: ({ page, limit, total }) => (page * limit < total ? page + 1 : undefined),
    enabled: date !== undefined,
  });

export const useOrder = (orderId: string) =>
  useQuery({
    queryKey: [...ORDERS_KEY, 'detail', orderId],
    queryFn: () => api<Order>(`/orders/${orderId}`),
  });

// Placing or cancelling an order moves stock, so product pages go out of date as well
const refreshAfterOrderChange = (queryClient: QueryClient) =>
  Promise.all(
    [ORDERS_KEY, CART_KEY, FARM_PRODUCTS_KEY, ['products'], ['product']].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );

export const usePlaceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { fulfilmentType: FulfilmentType; timeSlot: string; addressId?: string }) =>
      api<{ orderGroupId: string; orders: Order[] }>('/orders/from-cart', { method: 'POST', body }),
    // On failure too: a refusal means something in the cart changed, and the buyer should see it
    onSettled: () => refreshAfterOrderChange(queryClient),
  });
};

export const useCancelOrder = (orderId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    // Sent with no body when empty, as the API refuses a blank reason
    mutationFn: (reason?: string) =>
      api<Order>(`/orders/${orderId}/cancel`, {
        method: 'POST',
        ...(reason && { body: { reason } }),
      }),
    onSettled: () => refreshAfterOrderChange(queryClient),
  });
};

export const useUpdateOrderStatus = (orderId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: 'CONFIRMED' | 'COMPLETED') =>
      api<Order>(`/orders/${orderId}/status`, { method: 'PATCH', body: { status } }),
    // A refusal means someone else moved the order, so show where it is now
    onSettled: () => refreshAfterOrderChange(queryClient),
  });
};
