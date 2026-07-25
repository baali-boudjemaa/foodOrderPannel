import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getStoredUser, isLoggedIn } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import {
  createRestaurant,
  fetchMyRestaurant,
  updateRestaurant,
  setWorkingHours,
  type WorkingHourInput,
} from '@/lib/ownerApi';
import type { Restaurant } from '@/types';
import LocationPicker, { isMapAvailable } from '@/components/LocationPicker';

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const STEP_LABELS = ['بيانات المطعم', 'الموقع على الخريطة', 'الصور وساعات العمل', 'المراجعة والإرسال'];

function defaultWorkingHours(): WorkingHourInput[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    openTime: '09:00',
    closeTime: '23:00',
    isClosed: false,
  }));
}

interface FormState {
  name: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string;
  coverUrl: string;
  workingHours: WorkingHourInput[];
}

export default function RestaurantSetupWizard() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const isEditMode = router.query.edit === '1';

  const [step, setStep] = useState(1);
  const [existing, setExisting] = useState<Restaurant | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    logoUrl: '',
    coverUrl: '',
    workingHours: defaultWorkingHours(),
  });

  useEffect(() => {
    const user = getStoredUser();
    if (!isLoggedIn() || user?.role !== 'OWNER') {
      openAuthModal();
      router.push('/');
      return;
    }
    (async () => {
      try {
        const mine = await fetchMyRestaurant();
        if (mine) {
          setExisting(mine);
          setForm({
            name: mine.name,
            description: mine.description || '',
            address: mine.address || '',
            latitude: mine.latitude,
            longitude: mine.longitude,
            logoUrl: mine.logoUrl || '',
            coverUrl: mine.coverUrl || '',
            workingHours:
              mine.workingHours && mine.workingHours.length > 0
                ? mine.workingHours.map((h) => ({
                    dayOfWeek: h.dayOfWeek,
                    openTime: h.openTime,
                    closeTime: h.closeTime,
                    isClosed: h.isClosed,
                  }))
                : defaultWorkingHours(),
          });
        } else if (router.query.edit) {
          // Nothing to edit yet — send them through setup normally.
          router.replace('/owner/setup');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'تعذر تحميل البيانات');
      } finally {
        setChecking(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateHour(dayOfWeek: number, patch: Partial<WorkingHourInput>) {
    setForm((prev) => ({
      ...prev,
      workingHours: prev.workingHours.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)),
    }));
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateForm('latitude', pos.coords.latitude);
        updateForm('longitude', pos.coords.longitude);
        setError('');
      },
      () => setError('تعذر الوصول إلى موقعك، يمكنك إدخال الإحداثيات يدوياً')
    );
  }

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!form.name.trim()) return 'يرجى إدخال اسم المطعم';
    }
    if (current === 2) {
      if (form.latitude === null || form.longitude === null) return 'يرجى تحديد موقع المطعم على الخريطة';
    }
    return null;
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setError('');
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (form.latitude === null || form.longitude === null) {
      setError('يرجى تحديد موقع المطعم على الخريطة');
      setStep(2);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        logoUrl: form.logoUrl.trim() || undefined,
        coverUrl: form.coverUrl.trim() || undefined,
        workingHours: form.workingHours,
      };

      if (existing) {
        await updateRestaurant(existing.id, payload);
        await setWorkingHours(existing.id, form.workingHours);
      } else {
        await createRestaurant(payload);
      }
      router.replace('/owner');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر حفظ بيانات المطعم');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return <p className="text-center py-16 text-gray-500">جارِ التحميل...</p>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-16">
      <h1 className="text-2xl font-bold mb-1 text-center">
        {isEditMode || existing ? 'تعديل بيانات المطعم' : 'إعداد مطعمك'}
      </h1>
      <p className="text-center text-gray-500 text-sm mb-8">
        {isEditMode || existing
          ? 'حدّث بيانات مطعمك في أي وقت'
          : 'أكمل الخطوات التالية لتفعيل مطعمك واستقبال الطلبات'}
      </p>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={label} className="flex-1 flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${
                  isDone
                    ? 'bg-primary text-white'
                    : isActive
                    ? 'border-2 border-primary text-primary'
                    : 'border-2 border-gray-200 text-gray-400'
                }`}
              >
                {isDone ? '✓' : num}
              </div>
              <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

      <div className="border rounded-xl p-6 bg-white">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg mb-2">بيانات المطعم</h2>
            <input
              type="text"
              placeholder="اسم المطعم"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              placeholder="وصف مختصر عن المطعم (اختياري)"
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="العنوان (اختياري)"
              value={form.address}
              onChange={(e) => updateForm('address', e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg mb-2">حدد موقع المطعم</h2>
            <p className="text-sm text-gray-500">
              {isMapAvailable
                ? 'استخدم موقعك الحالي، انقر على الخريطة، أو أدخل الإحداثيات يدوياً. سيظهر هذا الموقع للعملاء عند البحث عن الأقرب.'
                : 'استخدم موقعك الحالي أو أدخل الإحداثيات يدوياً. سيظهر هذا الموقع للعملاء عند البحث عن الأقرب.'}
            </p>
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="border-2 border-primary text-primary px-4 py-2 rounded-lg text-sm hover:bg-primary/10"
            >
              📍 استخدام موقعي الحالي
            </button>

            {isMapAvailable && (
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) => {
                  updateForm('latitude', lat);
                  updateForm('longitude', lng);
                }}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">خط العرض (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude ?? ''}
                  onChange={(e) => updateForm('latitude', e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">خط الطول (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude ?? ''}
                  onChange={(e) => updateForm('longitude', e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            {form.latitude !== null && form.longitude !== null && (
              <p className="text-xs text-gray-400">
                الموقع المحدد: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-lg mb-2">الصور</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="رابط شعار المطعم (Logo URL)"
                  value={form.logoUrl}
                  onChange={(e) => updateForm('logoUrl', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="رابط صورة الغلاف (Cover URL)"
                  value={form.coverUrl}
                  onChange={(e) => updateForm('coverUrl', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">ساعات العمل</h2>
              <div className="space-y-2">
                {form.workingHours.map((h) => (
                  <div key={h.dayOfWeek} className="flex items-center gap-2 flex-wrap">
                    <span className="w-16 text-sm shrink-0">{DAY_NAMES[h.dayOfWeek]}</span>
                    <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                      <input
                        type="checkbox"
                        checked={!h.isClosed}
                        onChange={(e) => updateHour(h.dayOfWeek, { isClosed: !e.target.checked })}
                      />
                      مفتوح
                    </label>
                    {!h.isClosed && (
                      <>
                        <input
                          type="time"
                          value={h.openTime}
                          onChange={(e) => updateHour(h.dayOfWeek, { openTime: e.target.value })}
                          className="border rounded-lg px-2 py-1 text-sm"
                        />
                        <span className="text-gray-400 text-sm">إلى</span>
                        <input
                          type="time"
                          value={h.closeTime}
                          onChange={(e) => updateHour(h.dayOfWeek, { closeTime: e.target.value })}
                          className="border rounded-lg px-2 py-1 text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg mb-2">راجع بياناتك قبل الإرسال</h2>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                {form.logoUrl && <img src={form.logoUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className="font-semibold">{form.name || '—'}</p>
                {form.address && <p className="text-sm text-gray-500">{form.address}</p>}
              </div>
            </div>
            {form.description && <p className="text-sm text-gray-600">{form.description}</p>}
            <div className="text-sm">
              <p className="text-gray-500 mb-1">الموقع</p>
              <p>
                {form.latitude !== null && form.longitude !== null
                  ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`
                  : 'غير محدد'}
              </p>
            </div>
            <div className="text-sm">
              <p className="text-gray-500 mb-2">ساعات العمل</p>
              <ul className="space-y-1">
                {form.workingHours.map((h) => (
                  <li key={h.dayOfWeek} className="flex justify-between max-w-xs">
                    <span>{DAY_NAMES[h.dayOfWeek]}</span>
                    <span className="text-gray-500">{h.isClosed ? 'مغلق' : `${h.openTime} - ${h.closeTime}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="px-6 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
        >
          رجوع
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={goNext}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark"
          >
            التالي
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? '...جارِ الإرسال' : existing ? 'حفظ التعديلات' : 'إرسال وإنشاء المطعم'}
          </button>
        )}
      </div>
    </main>
  );
}
