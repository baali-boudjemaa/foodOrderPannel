import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getStoredUser, isLoggedIn } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import { fetchRestaurantOrders, updateOrderStatus } from '@/lib/ownerApi';
import type { Order, OrderStatus } from '@/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'قيد الانتظار',
  ACCEPTED: 'تم القبول',
  PREPARING: 'قيد التحضير',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-yellow-100 text-yellow-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

// The next available action(s) an owner can take for a given order status.
const NEXT_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }[]>> = {
  PENDING: [
    { label: 'قبول الطلب', next: 'ACCEPTED' },
    { label: 'رفض الطلب', next: 'CANCELLED' },
  ],
  ACCEPTED: [{ label: 'بدء التحضير', next: 'PREPARING' }],
  PREPARING: [{ label: 'جاهز للتوصيل', next: 'OUT_FOR_DELIVERY' }],
};

export default function OwnerOrdersPage() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!isLoggedIn() || user?.role !== 'OWNER') {
      openAuthModal();
      router.push('/');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRestaurantOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر تحديث حالة الطلب');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <p className="text-center py-16 text-gray-500">جارِ التحميل...</p>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">إدارة الطلبات</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {orders.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-10">لا توجد طلبات بعد</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-xl p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{order.deliveryAddress || 'بدون عنوان'}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('ar')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              <ul className="text-sm text-gray-600 mb-3">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.product.name}
                  </li>
                ))}
              </ul>

              {order.notes && <p className="text-sm text-gray-500 mb-3">ملاحظات: {order.notes}</p>}

              <div className="flex justify-between items-center">
                <p className="font-semibold">{Number(order.totalPrice).toFixed(2)} ر.س</p>
                <div className="flex gap-2">
                  {(NEXT_ACTIONS[order.status] || []).map((action) => (
                    <button
                      key={action.next}
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => handleStatusChange(order.id, action.next)}
                      className={`px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 ${
                        action.next === 'CANCELLED'
                          ? 'border border-red-300 text-red-600 hover:bg-red-50'
                          : 'bg-primary text-white hover:bg-primary-dark'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
