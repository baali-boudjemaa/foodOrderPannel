import type { AppProps } from 'next/app';
import Head from 'next/head';
import AppShell from '@/components/AppShell';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>منصة المطاعم | اطلب من أقرب مطعم لك</title>
        <meta name="description" content="اكتشف أفضل المطاعم القريبة منك واطلب طعامك المفضل بسهولة" />
      </Head>
      <AppShell>
        <Component {...pageProps} />
      </AppShell>
    </>
  );
}
