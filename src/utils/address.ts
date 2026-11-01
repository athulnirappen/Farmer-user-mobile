import type { IconName } from '@/components/ui';

type Lines = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  pincode: string | null;
};

export const addressLines = ({ line1, line2, city, pincode }: Lines) =>
  [line1, line2, city, pincode].filter(Boolean).join(', ');

export const addressIcon = (label: string | null): IconName => {
  if (label && /home/i.test(label)) return 'home-outline';
  if (label && /office|work/i.test(label)) return 'business-outline';
  return 'location-outline';
};
