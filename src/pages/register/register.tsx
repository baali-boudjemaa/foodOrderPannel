import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api } from '@/lib/api';
import { completeAuth, getHomeRouteForRole } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import type { Role } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'عميل',
  OWNER: 'صاحب مطعم',
  DELIVERY: 'مندوب توصيل',
};

const VALID_ROLES = ['CUSTOMER', 'OWNER', 'DELIVERY'];

export default function RegisterPage() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const roleParam =
    typeof router.query.role === 'string' ? router.query.role.toUpperCase() : '';

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'CUSTOMER' as Role,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (VALID_ROLES.includes(roleParam)) {
      setForm((prev) => ({ ...prev, role: roleParam as Role }));
    }
  }, [roleParam]);

  // انتظار جاهزية الراوتر لقراءة query params (router.query فارغ في أول render)
  if (!router.isReady) {
    return <main className="max-w-md mx-auto px-4 py-16 text-center">جارِ التحميل...</main>;
  }

  if (!VALID_ROLES.includes(roleParam)) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">إنشاء حساب جديد</h1>
        <p className="text-gray-500 mb-6">يرجى اختيار نوع الحساب أولاً</p>
        <button
          type="button"
          onClick={openAuthModal}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
        >
          اختيار نوع الحساب
        </button>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      const user = await completeAuth(data.accessToken, data.refreshToken);
      router.push(getHomeRouteForRole(user.role));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2 text-center">إنشاء حساب جديد</h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        التسجيل كـ{' '}
        <span className="font-medium text-primary">{ROLE_LABELS[form.role]}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="الاسم الكامل"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? '...جارِ الإنشاء' : 'إنشاء حساب'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="text-primary font-medium">
          تسجيل الدخول
        </Link>
      </p>
    </main>
  );
}
