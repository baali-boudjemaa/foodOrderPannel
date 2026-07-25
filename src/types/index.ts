export type Role = 'ADMIN' | 'OWNER' | 'CUSTOMER' | 'DELIVERY';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  address?: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  distanceKm?: number;
  categories?: Category[];
  workingHours?: WorkingHour[];
}

export interface WorkingHour {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  products?: Product[];
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: string;
  addons?: ProductAddon[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAddons: ProductAddon[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: Product;
  selectedAddons?: ProductAddon[];
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
  restaurant?: Restaurant;
}
