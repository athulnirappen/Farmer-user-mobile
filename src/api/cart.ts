import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import type { Cart } from '@/api/types';
import { PRIVATE_KEY, useSession } from '@/auth/session';

export const CART_KEY = [PRIVATE_KEY, 'cart'];

export const useCart = () => {
  const { signedIn } = useSession();

  return useQuery({
    queryKey: CART_KEY,
    queryFn: () => api<Cart>('/cart'),
    enabled: signedIn === true,
  });
};

export const addToCart = (productId: string, quantity: number) =>
  api<Cart>('/cart/items', { method: 'POST', body: { productId, quantity } });

export const setCartQuantity = (productId: string, quantity: number) =>
  api<Cart>(`/cart/items/${productId}`, { method: 'PATCH', body: { quantity } });

export const removeFromCart = (productId: string) =>
  api<Cart>(`/cart/items/${productId}`, { method: 'DELETE' });

// Every cart call answers with the whole cart, so the answer replaces what's on screen
export const useCartUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: () => Promise<Cart>) => update(),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
    // A refused change usually means the cart on screen is out of date
    onError: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });
};
