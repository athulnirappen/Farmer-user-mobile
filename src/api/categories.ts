import { useQuery } from '@tanstack/react-query';

import { publicApi } from '@/api/client';
import type { Category, Paginated } from '@/api/types';

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: () => publicApi<Paginated<Category>>('/categories', { query: { limit: 100 } }),
  });
