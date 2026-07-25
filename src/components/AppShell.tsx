import { AuthModalProvider } from '@/context/AuthModalContext';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <Header />
      {children}
    </AuthModalProvider>
  );
}
