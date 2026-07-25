import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { useAuthModal } from '@/context/AuthModalContext';
import { useCartStore } from '@/hooks/useCartStore';

export default function CartPage() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const { items, restaurantId, updateQuantity, removeItem, clear, total } = useCartStore();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    if (!restaurantId) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/orders', {
        restaurantId,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          selectedAddons: i.selectedAddons.map((a) => ({ name: a.name, price: a.price })),
        })),
        deliveryAddress: address,
        notes,
      });
      clear();
      router.push('/orders');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'يجب تسجيل الدخول لإتمام الطلب';
      setError(message);
      if (err?.response?.status === 401) openAuthModal();
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-center py-16 text-gray-500">سلتك فارغة</p>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">سلة المشتريات</h1>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.product.id} className="flex justify-between items-center border rounded-lg p-3 bg-white">
            <div>
              <h3 className="font-medium">{item.product.name}</h3>
              <p className="text-sm text-gray-500">{Number(item.product.price).toFixed(2)} ر.س</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                className="w-7 h-7 border rounded-full"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                className="w-7 h-7 border rounded-full"
              >
                +
              </button>
              <button onClick={() => removeItem(item.product.id)} className="text-red-500 text-sm ml-2">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      <textarea
        placeholder="عنوان التوصيل"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 mb-3"
        rows={2}
      />
      <textarea
        placeholder="ملاحظات إضافية (اختياري)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 mb-4"
        rows={2}
      />

      <div className="flex justify-between items-center mb-4 text-lg font-semibold">
        <span>الإجمالي</span>
        <span>{total().toFixed(2)} ر.س</span>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={loading || !address}
        className="w-full bg-primary text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? '...جارِ الإرسال' : 'تأكيد الطلب'}
      </button>
    </main>
  );
}
