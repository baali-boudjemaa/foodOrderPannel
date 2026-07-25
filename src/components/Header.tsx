import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearAuth, getStoredUser } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import type { User } from '@/types';
import AuthModal from './AuthModal';

export default function Header() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function handleLogout() {
    clearAuth();
    setUser(null);
    router.push('/');
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            منصة المطاعم
          </Link>

          <nav className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'DELIVERY' && (
                  <Link href="/delivery" className="px-3 py-2 text-sm text-gray-600 hover:text-primary">
                    لوحة التوصيل
                  </Link>
                )}
                {user.role === 'OWNER' && (
                  <Link href="/owner" className="px-3 py-2 text-sm text-gray-600 hover:text-primary">
                    لوحة التحكم
                  </Link>
                )}
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link href="/orders" className="px-3 py-2 text-sm text-gray-600 hover:text-primary">
                      طلباتي
                    </Link>
                    <Link href="/cart" className="px-3 py-2 text-sm text-gray-600 hover:text-primary">
                      السلة
                    </Link>
                  </>
                )}
                <span className="text-sm text-gray-600 hidden sm:inline">{user.fullName}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
                >
                  خروج
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  إنشاء حساب
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <AuthModal />
    </>
  );
}
