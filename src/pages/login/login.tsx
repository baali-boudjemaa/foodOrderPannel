import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { completeAuth, getHomeRouteForRole } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';

export default function LoginPage() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const user = await completeAuth(data.accessToken, data.refreshToken);
      router.push(getHomeRouteForRole(user.role));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6 text-center">تسجيل الدخول</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? '...جارِ الدخول' : 'دخول'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        ليس لديك حساب؟{' '}
        <button type="button" onClick={openAuthModal} className="text-primary font-medium hover:underline">
          إنشاء حساب
        </button>
      </p>
    </main>
  );
}
