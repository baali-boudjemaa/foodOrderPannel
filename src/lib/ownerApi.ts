import { api } from './api';
import type { Category, Order, Product, Restaurant, WorkingHour } from '@/types';

export type WorkingHourInput = Omit<WorkingHour, 'id'>;

export interface RestaurantSetupPayload {
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  logoUrl?: string;
  coverUrl?: string;
  workingHours: WorkingHourInput[];
}

/** Fetch the current owner's restaurant. Returns null if they haven't set one up yet. */
export async function fetchMyRestaurant(): Promise<Restaurant | null> {
  try {
    const { data } = await api.get<Restaurant>('/restaurants/owner/mine');
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

export async function createRestaurant(payload: RestaurantSetupPayload): Promise<Restaurant> {
  const { data } = await api.post<Restaurant>('/restaurants', payload);
  return data;
}

export async function updateRestaurant(
  id: string,
  payload: Partial<RestaurantSetupPayload> & { isActive?: boolean }
): Promise<Restaurant> {
  const { data } = await api.patch<Restaurant>(`/restaurants/${id}`, payload);
  return data;
}

export async function setWorkingHours(id: string, workingHours: WorkingHourInput[]): Promise<WorkingHour[]> {
  const { data } = await api.put<WorkingHour[]>(`/restaurants/${id}/working-hours`, { workingHours });
  return data;
}

export async function fetchRestaurantOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/orders/restaurant/mine');
  return data;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const { data } = await api.patch<Order>(`/orders/${orderId}/status`, { status });
  return data;
}

export async function createCategory(restaurantId: string, name: string, order = 0): Promise<Category> {
  const { data } = await api.post<Category>(`/restaurants/${restaurantId}/categories`, { name, order });
  return data;
}

export async function updateCategory(categoryId: string, payload: { name?: string; order?: number }): Promise<Category> {
  const { data } = await api.patch<Category>(`/categories/${categoryId}`, payload);
  return data;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await api.delete(`/categories/${categoryId}`);
}

export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export async function createProduct(categoryId: string, payload: ProductPayload): Promise<Product> {
  const { data } = await api.post<Product>(`/categories/${categoryId}/products`, payload);
  return data;
}

export async function updateProduct(productId: string, payload: Partial<ProductPayload>): Promise<Product> {
  const { data } = await api.patch<Product>(`/products/${productId}`, payload);
  return data;
}

export async function deleteProduct(productId: string): Promise<void> {
  await api.delete(`/products/${productId}`);
}
