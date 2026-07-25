import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getStoredUser, isLoggedIn } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import { fetchMyRestaurant, fetchRestaurantOrders, updateRestaurant } from '@/lib/ownerApi';
import type { Order, Restaurant } from '@/types';

const ACTIVE_ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'];

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingActive, setTogglingActive] = useState(false);

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
      const mine = await fetchMyRestaurant();
      if (!mine) {
        router.replace('/owner/setup');
        return;
      }
      setRestaurant(mine);
      const ordersData = await fetchRestaurantOrders();
      setOrders(ordersData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    if (!restaurant) return;
    setTogglingActive(true);
    try {
      const updated = await updateRestaurant(restaurant.id, { isActive: !restaurant.isActive });
      setRestaurant(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر تحديث حالة المطعم');
    } finally {
      setTogglingActive(false);
    }
  }

  if (loading) {
    return <p className="text-center py-16 text-gray-500">جارِ التحميل...</p>;
  }

  if (!restaurant) {
    // We already redirect to /owner/setup above; this is just a safety fallback.
    return null;
  }

  const activeOrders = orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
  const todaysHours = restaurant.workingHours?.find((h) => h.dayOfWeek === new Date().getDay());

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0">
            {restaurant.logoUrl && (
              <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            {restaurant.address && <p className="text-sm text-gray-500">{restaurant.address}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleActive}
          disabled={togglingActive}
          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 disabled:opacity-50 ${
            restaurant.isActive
              ? 'border-green-600 text-green-700 hover:bg-green-50'
              : 'border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {restaurant.isActive ? '● مفتوح لاستقبال الطلبات' : '○ مغلق حالياً'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="border rounded-xl p-4 bg-white">
          <p className="text-sm text-gray-500 mb-1">طلبات نشطة</p>
          <p className="text-2xl font-bold text-primary">{activeOrders.length}</p>
        </div>
        <div className="border rounded-xl p-4 bg-white">
          <p className="text-sm text-gray-500 mb-1">إجمالي الطلبات</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="border rounded-xl p-4 bg-white">
          <p className="text-sm text-gray-500 mb-1">ساعات العمل اليوم</p>
          <p className="text-sm font-medium">
            {!todaysHours || todaysHours.isClosed
              ? 'مغلق'
              : `${todaysHours.openTime} - ${todaysHours.closeTime}`}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/owner/orders"
          className="border rounded-xl p-5 bg-white hover:shadow-lg transition-shadow"
        >
          <p className="text-2xl mb-2">📦</p>
          <h2 className="font-semibold mb-1">إدارة الطلبات</h2>
          <p className="text-sm text-gray-500">تابع الطلبات الواردة وحدّث حالتها</p>
        </Link>
        <Link
          href="/owner/menu"
          className="border rounded-xl p-5 bg-white hover:shadow-lg transition-shadow"
        >
          <p className="text-2xl mb-2">🍔</p>
          <h2 className="font-semibold mb-1">إدارة القائمة</h2>
          <p className="text-sm text-gray-500">أضف وعدّل الأقسام والمنتجات</p>
        </Link>
        <Link
          href="/owner/setup?edit=1"
          className="border rounded-xl p-5 bg-white hover:shadow-lg transition-shadow"
        >
          <p className="text-2xl mb-2">⚙️</p>
          <h2 className="font-semibold mb-1">إعدادات المطعم</h2>
          <p className="text-sm text-gray-500">عدّل بيانات المطعم والموقع وساعات العمل</p>
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">أحدث الطلبات</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500 text-sm">لا توجد طلبات بعد</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="border rounded-xl p-4 bg-white flex justify-between items-center">
                <div>
                  <p className="font-medium">{order.deliveryAddress || 'بدون عنوان'}</p>
                  <p className="text-sm text-gray-500">
                    {order.items.length} عناصر · {Number(order.totalPrice).toFixed(2)} ر.س
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{order.status}</span>
              </div>
            ))}
          </div>
        )}
        {orders.length > 0 && (
          <Link href="/owner/orders" className="inline-block mt-3 text-sm text-primary hover:underline">
            عرض كل الطلبات ←
          </Link>
        )}
      </section>
    </main>
  );
}
