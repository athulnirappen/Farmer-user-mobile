export type Session = {
  accessToken: string;
  refreshToken: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  // Prisma Decimal, which reaches JSON as a string
  price: string;
  stock: number;
  unit: string;
  isActive: boolean;
  images: { id: string; url: string }[];
  category: { id: string; name: string };
  farmer: {
    id: string;
    farmName: string;
    farmLocation: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  // Only present when the list was filtered by the buyer's position
  distanceKm?: number;
};

// A farmer's own view of a listing, including why an admin hid it
export type OwnedProduct = Product & {
  hiddenAt: string | null;
  hiddenReason: string | null;
};

export type Declaration = {
  version: string;
  text: string;
};

export type Farm = {
  id: string;
  farmName: string;
  farmLocation: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  productCount: number;
};

export type FarmerStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  farmerStatus: FarmerStatus;
  farmer: {
    id: string;
    farmName: string;
    farmLocation: string | null;
    latitude: number | null;
    longitude: number | null;
    rejectionReason: string | null;
  } | null;
};

export type AuthStart = {
  nextStep: 'REGISTER' | 'VERIFY_LOGIN';
  message: string;
};

export type CartIssue = 'UNAVAILABLE' | 'INSUFFICIENT_STOCK' | 'PRICE_CHANGED';

export type CartItem = {
  productId: string;
  quantity: number;
  unitPrice: string;
  unitPriceAtAdd: string;
  lineTotal: string;
  availableStock: number;
  issue: CartIssue | null;
  product: {
    id: string;
    name: string;
    unit: string;
    farmer: { id: string; farmName: string; farmLocation: string | null };
  };
};

export type Cart = {
  items: CartItem[];
  itemCount: number;
  subtotal: string;
  hasIssues: boolean;
};

export type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  pincode: string;
  isDefault: boolean;
};

export type AddressInput = {
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  pincode: string;
};

export type OrderSlots = {
  deliveryDate: string;
  isOpen: boolean;
  cutoffHour: number;
  slots: { id: string; label: string }[];
};

export type FulfilmentType = 'DELIVERY' | 'PICKUP';
export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type Order = {
  id: string;
  status: OrderStatus;
  fulfilmentType: FulfilmentType;
  deliveryDate: string;
  timeSlot: string;
  paymentMethod: 'CASH_ON_DELIVERY';
  totalAmount: string;
  contactName: string | null;
  contactPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  pincode: string | null;
  pickupLocation: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    unit: string;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }[];
  farmer: { id: string; farmName: string };
};
