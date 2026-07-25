import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { getStoredUser, isLoggedIn } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import type { Order } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  OUT_FOR_DELIVERY: 'جاهز للتوصيل',
  DELIVERED: 'تم التوصيل',
};

export default function DeliveryPage() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const [available, setAvailable] = useState<Order[]>([]);
  const [mine, setMine] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!isLoggedIn() || user?.role !== 'DELIVERY') {
      openAuthModal();
      router.push('/');
      return;
    }
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const [availableRes, mineRes] = await Promise.all([
        api.get<Order[]>('/orders/delivery/available'),
        api.get<Order[]>('/orders/delivery/mine'),
      ]);
      setAvailable(availableRes.data);
      setMine(mineRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(orderId: string) {
    try {
      await api.patch(`/orders/${orderId}/assign-delivery`);
      await loadOrders();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر قبول الطلب');
    }
  }

  async function handleDeliver(orderId: string) {
    try {
      await api.patch(`/orders/${orderId}/delivery-status`, { status: 'DELIVERED' });
      await loadOrders();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر تحديث حالة الطلب');
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">لوحة مندوب التوصيل</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">جارِ التحميل...</p>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">طلبات متاحة ({available.length})</h2>
            {available.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد طلبات متاحة حالياً</p>
            ) : (
              <div className="space-y-3">
                {available.map((order) => (
                  <div key={order.id} className="border rounded-xl p-4 bg-white">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-medium">{order.restaurant?.name}</p>
                        <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                        <p className="text-sm text-primary mt-1">{Number(order.totalPrice).toFixed(2)} ر.س</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssign(order.id)}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark"
                      >
                        قبول الطلب
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">طلباتي ({mine.length})</h2>
            {mine.length === 0 ? (
              <p className="text-gray-500 text-sm">لم تقبل أي طلب بعد</p>
            ) : (
              <div className="space-y-3">
                {mine.map((order) => (
                  <div key={order.id} className="border rounded-xl p-4 bg-white">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-medium">{order.restaurant?.name}</p>
                        <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                        <p className="text-xs text-gray-400 mt-1">{STATUS_LABELS[order.status] || order.status}</p>
                      </div>
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          type="button"
                          onClick={() => handleDeliver(order.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                        >
                          تم التوصيل
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
