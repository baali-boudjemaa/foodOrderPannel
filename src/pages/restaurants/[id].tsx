import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { Restaurant, Product } from '@/types';
import { useCartStore } from '@/hooks/useCartStore';

export default function RestaurantPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/restaurants/${id}`)
      .then(({ data }) => setRestaurant(data))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd(product: Product) {
    if (!restaurant) return;
    addItem(restaurant.id, product, 1, []);
  }

  if (loading) return <p className="text-center py-16 text-gray-500">جارِ التحميل...</p>;
  if (!restaurant) return <p className="text-center py-16 text-gray-500">المطعم غير موجود</p>;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <div className="h-40 bg-gray-200 rounded-xl mb-4 overflow-hidden">
        {restaurant.coverUrl && (
          <img src={restaurant.coverUrl} alt={restaurant.name} className="w-full h-full object-cover" />
        )}
      </div>

      <h1 className="text-2xl font-bold mb-1">{restaurant.name}</h1>
      {restaurant.address && <p className="text-gray-500 mb-1">{restaurant.address}</p>}
      {restaurant.description && <p className="text-gray-600 mb-6">{restaurant.description}</p>}

      {(restaurant.categories || []).map((category) => (
        <section key={category.id} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">{category.name}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {(category.products || []).map((product) => (
              <div key={product.id} className="border rounded-lg p-3 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  )}
                  <p className="text-primary font-semibold mt-1">{Number(product.price).toFixed(2)} ر.س</p>
                </div>
                <button
                  onClick={() => handleAdd(product)}
                  disabled={!product.isAvailable}
                  className="bg-primary text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-40"
                >
                  {product.isAvailable ? 'أضف' : 'غير متاح'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {cartItems.length > 0 && (
        <button
          onClick={() => router.push('/cart')}
          className="fixed bottom-4 inset-x-4 max-w-4xl mx-auto bg-primary text-white py-3 rounded-xl font-medium shadow-lg"
        >
          عرض السلة ({cartItems.length}) 🛒
        </button>
      )}
    </main>
  );
}
