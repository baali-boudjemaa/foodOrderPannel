import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/types';

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'قيد الانتظار',
  ACCEPTED: 'تم القبول',
  PREPARING: 'قيد التحضير',
  OUT_FOR_DELIVERY: 'في الطريق إليك',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-yellow-100 text-yellow-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders/me')
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-16 text-gray-500">جارِ التحميل...</p>;
  if (orders.length === 0) return <p className="text-center py-16 text-gray-500">لا توجد طلبات بعد</p>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">طلباتي</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{order.restaurant?.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <ul className="text-sm text-gray-600 mb-2">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}× {item.product.name}
                </li>
              ))}
            </ul>
            <p className="font-semibold">{Number(order.totalPrice).toFixed(2)} ر.س</p>
          </div>
        ))}
      </div>
    </main>
  );
}
