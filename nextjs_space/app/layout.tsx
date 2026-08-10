import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AIChatbot } from '@/components/ai-chatbot';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const playfair = Playfair_Display({ subsets: ['latin', 'vietnamese'], variable: '--font-serif', weight: ['400', '500', '600', '700'] });

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'Orion - Phần mềm & Dịch vụ AI',
  description: 'CÔNG TY CỔ PHẦN ORION QUỐC TẾ - Cung cấp phần mềm ERP, giải pháp AI và dịch vụ công nghệ cho doanh nghiệp',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-pathname') || '';
  const isEmbed = pathname.startsWith('/embed');

  if (isEmbed) {
    // Standalone layout for embeddable widgets — no site header/footer/chatbot.
    return (
      <html lang="vi" suppressHydrationWarning>
        <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} ${playfair.variable} font-sans`}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} ${playfair.variable} font-sans`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <AIChatbot />
        </Providers>
      </body>
    </html>
  );
}
