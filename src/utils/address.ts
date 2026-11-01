type Lines = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  pincode: string | null;
};

export const addressLines = ({ line1, line2, city, pincode }: Lines) =>
  [line1, line2, city, pincode].filter(Boolean).join(', ');
