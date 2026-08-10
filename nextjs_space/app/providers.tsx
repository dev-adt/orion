'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider } from '@/lib/i18n-context';
import { Toaster } from '@/components/ui/sonner';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <I18nProvider>
          {children}
          <Toaster />
          <ChunkLoadErrorHandler />
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
