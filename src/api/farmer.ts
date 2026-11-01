import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { File } from 'expo-file-system';

import { api } from '@/api/client';
import type { Declaration, OwnedProduct, Paginated } from '@/api/types';
import { PRIVATE_KEY, PROFILE_KEY } from '@/auth/session';

export const FARM_PRODUCTS_KEY = [PRIVATE_KEY, 'farm', 'products'];
const DECLARATION_KEY = [PRIVATE_KEY, 'farm', 'declaration'];
const PAGE_SIZE = 20;

type FarmerApplication = {
  farmName: string;
  farmLocation: string;
  latitude: number;
  longitude: number;
};

// The profile carries the application's status, so it's the one thing to reload
export const useApplyAsFarmer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: FarmerApplication) =>
      api('/farmers/applications', { method: 'POST', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
};

export const useUpdateFarmLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { farmLocation?: string; latitude?: number; longitude?: number }) =>
      api('/farmers/me/location', { method: 'PATCH', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
};

export const useMyProducts = () =>
  useInfiniteQuery({
    queryKey: FARM_PRODUCTS_KEY,
    queryFn: ({ pageParam }) =>
      api<Paginated<OwnedProduct>>('/products/mine', {
        query: { page: pageParam, limit: PAGE_SIZE },
      }),
    initialPageParam: 1,
    getNextPageParam: ({ page, limit, total }) => (page * limit < total ? page + 1 : undefined),
  });

export const useDeclaration = () =>
  useQuery({
    queryKey: DECLARATION_KEY,
    queryFn: () => api<Declaration>('/products/declaration'),
  });

// Buyers see these listings too, so the public lists go out of date with the farmer's own
const refreshListings = (queryClient: QueryClient) =>
  Promise.all(
    [FARM_PRODUCTS_KEY, ['products'], ['product']].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );

export type ProductChanges = Partial<{
  name: string;
  description: string;
  price: number;
  stock: number;
  unit: string;
  categoryId: string;
  isActive: boolean;
  acceptDeclaration: boolean;
  declarationVersion: string;
}>;

export const useSaveProduct = (productId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ProductChanges) =>
      productId
        ? api<OwnedProduct>(`/products/${productId}`, { method: 'PATCH', body })
        : api<OwnedProduct>('/products', { method: 'POST', body }),
    onSuccess: () => refreshListings(queryClient),
    // The usual refusal is new declaration wording, which has to be shown before accepting it
    onError: () => queryClient.invalidateQueries({ queryKey: DECLARATION_KEY }),
  });
};

export const useDeleteProduct = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api(`/products/${productId}`, { method: 'DELETE' }),
    onSuccess: () => refreshListings(queryClient),
  });
};

const uploadProductImage = (productId: string, uri: string) => {
  const form = new FormData();
  // Expo's fetch needs a real file here; it refuses React Native's { uri, name, type } form.
  // The API works the type out from the file's contents and ignores its name.
  form.append('image', new File(uri) as unknown as Blob);
  return api(`/products/${productId}/images`, { method: 'POST', form });
};

// Photos wait on the phone until Save, as a new product has no id to attach them to before that
export const useUploadProductImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, uris }: { productId: string; uris: string[] }) => {
      for (const uri of uris) await uploadProductImage(productId, uri);
    },
    onSettled: () => refreshListings(queryClient),
  });
};

export const useProductImages = (productId: string) => {
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: (imageId: string) =>
      api(`/products/${productId}/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: () => refreshListings(queryClient),
  });

  return { remove };
};
