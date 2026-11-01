import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import type { Address, AddressInput } from '@/api/types';
import { PRIVATE_KEY, useSession } from '@/auth/session';

const ADDRESSES_KEY = [PRIVATE_KEY, 'addresses'];

export const useAddresses = () => {
  const { signedIn } = useSession();

  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: () => api<Address[]>('/users/me/addresses'),
    enabled: signedIn === true,
  });
};

export const useSaveAddress = (addressId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddressInput) => {
      if (addressId) {
        // null clears an optional field on edit
        return api<Address>(`/users/me/addresses/${addressId}`, { method: 'PATCH', body: input });
      }
      // Create has nothing to clear and refuses null, so blanks are left out
      const { label, line2, ...required } = input;
      return api<Address>('/users/me/addresses', {
        method: 'POST',
        body: { ...required, ...(label && { label }), ...(line2 && { line2 }) },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
};

export const deleteAddress = (addressId: string) =>
  api<Address[]>(`/users/me/addresses/${addressId}`, { method: 'DELETE' });

export const makeDefaultAddress = (addressId: string) =>
  api<Address[]>(`/users/me/addresses/${addressId}/default`, { method: 'POST' });

// Both answer with the whole list
export const useAddressAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: () => Promise<Address[]>) => action(),
    onSuccess: (addresses) => queryClient.setQueryData(ADDRESSES_KEY, addresses),
  });
};
