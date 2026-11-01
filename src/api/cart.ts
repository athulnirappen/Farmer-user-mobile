import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { api } from '@/api/client';
import type { Cart } from '@/api/types';
import { PRIVATE_KEY, useSession } from '@/auth/session';

export const CART_KEY = [PRIVATE_KEY, 'cart'];

// Long enough that a run of taps on the stepper becomes one request
const QUANTITY_DELAY_MS = 350;

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

const withQuantity = (cart: Cart, productId: string, quantity: number): Cart => {
  let difference = 0;
  const items = cart.items.map((item) => {
    if (item.productId !== productId) return item;
    const lineTotal = Number(item.unitPrice) * quantity;
    difference = lineTotal - Number(item.lineTotal);
    return { ...item, quantity, lineTotal: String(lineTotal) };
  });
  return { ...cart, items, subtotal: String(Number(cart.subtotal) + difference) };
};

// The screen moves on each tap and the API catches up behind it, so the cart never waits on it.
// Requests go one at a time, as a slow early one landing last would undo the latest quantity.
export const useCartQuantity = () => {
  const queryClient = useQueryClient();
  const waiting = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; quantity: number }>());
  const queue = useRef<Promise<void>>(Promise.resolve());
  const sending = useRef(0);
  const [error, setError] = useState<unknown>();

  const send = (productId: string, quantity: number) => {
    sending.current += 1;
    queue.current = queue.current.then(async () => {
      try {
        const cart = await setCartQuantity(productId, quantity);
        sending.current -= 1;
        // The answer only matches the screen once nothing newer is on its way
        if (sending.current === 0 && waiting.current.size === 0) {
          queryClient.setQueryData(CART_KEY, cart);
        }
      } catch (failure) {
        sending.current -= 1;
        setError(failure);
        await queryClient.invalidateQueries({ queryKey: CART_KEY });
      }
    });
  };

  const change = (productId: string, quantity: number) => {
    setError(undefined);
    // A refetch already running would put the old quantity back
    queryClient.cancelQueries({ queryKey: CART_KEY });
    queryClient.setQueryData<Cart>(
      CART_KEY,
      (cart) => cart && withQuantity(cart, productId, quantity)
    );

    const earlier = waiting.current.get(productId);
    if (earlier) clearTimeout(earlier.timer);
    const timer = setTimeout(() => {
      waiting.current.delete(productId);
      send(productId, quantity);
    }, QUANTITY_DELAY_MS);
    waiting.current.set(productId, { timer, quantity });
  };

  // For anything that needs the API to have the same cart as the screen
  const flush = () => {
    waiting.current.forEach(({ timer, quantity }, productId) => {
      clearTimeout(timer);
      send(productId, quantity);
    });
    waiting.current.clear();
    return queue.current;
  };

  return { change, flush, error };
};

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
