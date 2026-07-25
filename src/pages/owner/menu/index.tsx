import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getStoredUser, isLoggedIn } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import {
  fetchMyRestaurant,
  createCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/ownerApi';
import type { Restaurant } from '@/types';

export default function OwnerMenuPage() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [productDrafts, setProductDrafts] = useState<Record<string, { name: string; price: string }>>({});

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
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر تحميل القائمة');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant || !newCategoryName.trim()) return;
    try {
      await createCategory(restaurant.id, newCategoryName.trim(), restaurant.categories?.length || 0);
      setNewCategoryName('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر إضافة القسم');
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    try {
      await deleteCategory(categoryId);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر حذف القسم');
    }
  }

  async function handleAddProduct(categoryId: string, e: React.FormEvent) {
    e.preventDefault();
    const draft = productDrafts[categoryId];
    if (!draft || !draft.name.trim() || !draft.price) return;
    try {
      await createProduct(categoryId, {
        name: draft.name.trim(),
        price: Number(draft.price),
        isAvailable: true,
      });
      setProductDrafts((prev) => ({ ...prev, [categoryId]: { name: '', price: '' } }));
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر إضافة المنتج');
    }
  }

  async function handleToggleAvailable(productId: string, isAvailable: boolean) {
    try {
      await updateProduct(productId, { isAvailable: !isAvailable });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر تحديث المنتج');
    }
  }

  async function handleDeleteProduct(productId: string) {
    try {
      await deleteProduct(productId);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر حذف المنتج');
    }
  }

  if (loading) return <p className="text-center py-16 text-gray-500">جارِ التحميل...</p>;
  if (!restaurant) return null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">إدارة القائمة</h1>
      <p className="text-gray-500 text-sm mb-6">{restaurant.name}</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleAddCategory} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="اسم قسم جديد (مثال: المقبلات)"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">
          إضافة قسم
        </button>
      </form>

      {(restaurant.categories || []).length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-10">لا توجد أقسام بعد، أضف أول قسم لقائمتك</p>
      ) : (
        <div className="space-y-6">
          {(restaurant.categories || []).map((category) => (
            <section key={category.id} className="border rounded-xl p-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-lg">{category.name}</h2>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-500 text-sm hover:underline"
                >
                  حذف القسم
                </button>
              </div>

              <div className="space-y-2 mb-3">
                {(category.products || []).length === 0 ? (
                  <p className="text-gray-400 text-sm">لا توجد منتجات في هذا القسم</p>
                ) : (
                  category.products!.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center border rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">{Number(product.price).toFixed(2)} ر.س</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailable(product.id, product.isAvailable)}
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.isAvailable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {product.isAvailable ? 'متاح' : 'غير متاح'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-500 text-sm hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={(e) => handleAddProduct(category.id, e)} className="flex gap-2">
                <input
                  type="text"
                  placeholder="اسم المنتج"
                  value={productDrafts[category.id]?.name || ''}
                  onChange={(e) =>
                    setProductDrafts((prev) => ({
                      ...prev,
                      [category.id]: { name: e.target.value, price: prev[category.id]?.price || '' },
                    }))
                  }
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="السعر"
                  value={productDrafts[category.id]?.price || ''}
                  onChange={(e) =>
                    setProductDrafts((prev) => ({
                      ...prev,
                      [category.id]: { name: prev[category.id]?.name || '', price: e.target.value },
                    }))
                  }
                  className="w-24 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm hover:bg-primary-dark"
                >
                  إضافة
                </button>
              </form>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
