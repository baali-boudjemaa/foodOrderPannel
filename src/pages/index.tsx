import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Restaurant } from '@/types';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    setLoading(true);
    try {
      const { data } = await api.get('/restaurants');
      setRestaurants(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.get('/restaurants/search', { params: { q: query } });
      setRestaurants(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      setLoading(true);
      try {
        const { data } = await api.get('/restaurants/nearby', {
          params: { lat: pos.coords.latitude, lng: pos.coords.longitude, radiusKm: 5 },
        });
        setRestaurants(data);
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">اطلب من أقرب مطعم لك</h1>
        <p className="text-gray-600">تصفح المطاعم القريبة منك واطلب طعامك المفضل بسهولة</p>
      </header>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مطعم بالاسم أو الموقع..."
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">
          بحث
        </button>
        <button
          type="button"
          onClick={handleUseLocation}
          className="border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary/10"
        >
          الأقرب لي 📍
        </button>
      </form>

      {loading ? (
        <p className="text-center text-gray-500 py-10">جارِ التحميل...</p>
      ) : restaurants.length === 0 ? (
        <p className="text-center text-gray-500 py-10">لا توجد مطاعم مطابقة</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.id}`}
              className="border rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow"
            >
              <div className="h-32 bg-gray-200">
                {r.coverUrl && <img src={r.coverUrl} alt={r.name} className="w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-lg">{r.name}</h2>
                {r.address && <p className="text-sm text-gray-500">{r.address}</p>}
                {r.distanceKm !== undefined && (
                  <p className="text-xs text-primary mt-1">{r.distanceKm.toFixed(1)} كم</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
