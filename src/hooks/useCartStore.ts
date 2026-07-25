import { create } from 'zustand';
import { CartItem, Product, ProductAddon } from '@/types';

interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, product: Product, quantity: number, addons: ProductAddon[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  restaurantId: null,
  items: [],

  addItem: (restaurantId, product, quantity, addons) => {
    const current = get();

    // إفراغ السلة تلقائياً إذا الطلب من مطعم مختلف
    if (current.restaurantId && current.restaurantId !== restaurantId) {
      set({ restaurantId, items: [{ product, quantity, selectedAddons: addons }] });
      return;
    }

    const existingIndex = current.items.findIndex((i) => i.product.id === product.id);
    if (existingIndex >= 0) {
      const items = [...current.items];
      items[existingIndex].quantity += quantity;
      set({ restaurantId, items });
    } else {
      set({ restaurantId, items: [...current.items, { product, quantity, selectedAddons: addons }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    set({
      items: get().items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    });
  },

  clear: () => set({ restaurantId: null, items: [] }),

  total: () => {
    return get().items.reduce((sum, item) => {
      const addonsTotal = item.selectedAddons.reduce((a, addon) => a + addon.price, 0);
      return sum + (Number(item.product.price) + addonsTotal) * item.quantity;
    }, 0);
  },
}));
