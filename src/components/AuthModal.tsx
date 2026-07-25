import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthModal } from '@/context/AuthModalContext';
import type { Role } from '@/types';

type RegisterRole = Extract<Role, 'CUSTOMER' | 'OWNER' | 'DELIVERY'>;

const REGISTER_ROLES: { role: RegisterRole; label: string; description: string; icon: string }[] = [
  {
    role: 'CUSTOMER',
    label: 'عميل',
    description: 'اطلب طعامك من المطاعم القريبة',
    icon: '🛒',
  },
  {
    role: 'OWNER',
    label: 'صاحب مطعم',
    description: 'سجّل مطعمك واستقبل الطلبات',
    icon: '🍽️',
  },
  {
    role: 'DELIVERY',
    label: 'مندوب توصيل',
    description: 'انضم كسائق توصيل واكسب',
    icon: '🛵',
  },
];

export default function AuthModal() {
  const router = useRouter();
  const { isOpen, closeAuthModal } = useAuthModal();
  const [step, setStep] = useState<'choice' | 'role'>('choice');

  useEffect(() => {
    if (isOpen) setStep('choice');
  }, [isOpen]);

  if (!isOpen) return null;

  function handleClose() {
    setStep('choice');
    closeAuthModal();
  }

  function handleLogin() {
    handleClose();
    router.push('/login');
  }

  function handleRegisterChoice() {
    setStep('role');
  }

  function handleRoleSelect(role: RegisterRole) {
    handleClose();
    router.push(`/register?role=${role}`);
  }

  function handleBack() {
    setStep('choice');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute left-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="إغلاق"
        >
          ✕
        </button>

        {step === 'choice' ? (
          <>
            <h2 id="auth-modal-title" className="text-xl font-bold text-center mb-2">
              مرحباً بك
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">اختر كيف تريد المتابعة</p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleLogin}
                className="w-full rounded-xl border-2 border-primary bg-primary px-4 py-4 text-white font-semibold hover:bg-primary-dark transition-colors"
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={handleRegisterChoice}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                إنشاء حساب جديد
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-primary mb-4 hover:underline"
            >
              ← رجوع
            </button>
            <h2 id="auth-modal-title" className="text-xl font-bold text-center mb-2">
              نوع الحساب
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">اختر نوع حسابك للتسجيل</p>

            <div className="space-y-3">
              {REGISTER_ROLES.map(({ role, label, description, icon }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className="w-full flex items-center gap-4 rounded-xl border-2 border-gray-200 px-4 py-4 text-right hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
