'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from '@/lib/i18n-context';
import { useCartStore } from '@/lib/cart-store';
import {
  ShoppingCart,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  FileText,
  Package,
  Sparkles,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canAccessAdmin, canUseAiTools, type Role } from '@/lib/roles';

export function Navbar() {
  const { data: session } = useSession() || {};
  const role = (session?.user as any)?.role as Role | undefined;
  const { locale, setLocale, t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const [menuPages, setMenuPages] = useState<Array<{ id: string; title: string; titleEn?: string | null; slug: string }>>([]);

  useEffect(() => {
    fetch('/api/pages/menu')
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((d) => setMenuPages(d?.pages || []))
      .catch(() => setMenuPages([]));
  }, []);

  useEffect(() => {
    const unsub = useCartStore.subscribe((state) => {
      setItemCount(state?.getItemCount?.() ?? 0);
    });
    setItemCount(useCartStore.getState()?.getItemCount?.() ?? 0);
    return unsub;
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/90 backdrop-blur-md shadow-sm'
          : 'bg-background/70 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <Image src="/logo.png" alt="Orion" width={120} height={40} className="object-contain h-8 w-auto" priority />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" size="sm">{t('nav.home')}</Button>
          </Link>
          <Link href="/products">
            <Button variant="ghost" size="sm">{t('nav.products')}</Button>
          </Link>
          <Link href="/orion">
            <Button variant="ghost" size="sm">
              <Bot className="h-4 w-4 mr-1" />
              Orion
            </Button>
          </Link>
          <Link href="/tin-tuc">
            <Button variant="ghost" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              {t('nav.news')}
            </Button>
          </Link>
          {menuPages.map((p) => (
            <Link key={p.id} href={`/trang/${p.slug}`}>
              <Button variant="ghost" size="sm">
                {locale === 'en' ? p.titleEn || p.title : p.title}
              </Button>
            </Link>
          ))}
          {role === 'admin' && (
            <Link href="/ai-settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                {t('nav.ai_settings')}
              </Button>
            </Link>
          )}
          {session?.user && (
            <Link href="/tai-khoan">
              <Button variant="ghost" size="sm">
                <Package className="h-4 w-4 mr-1" />
                {locale === 'vi' ? 'Đơn hàng của tôi' : 'My Orders'}
              </Button>
            </Link>
          )}
          {session?.user && canUseAiTools(role) && (
            <Link href="/cong-cu-ai">
              <Button variant="ghost" size="sm">
                <Sparkles className="h-4 w-4 mr-1" />
                {locale === 'vi' ? 'Công cụ AI' : 'AI Tools'}
              </Button>
            </Link>
          )}
          {session?.user && canAccessAdmin(role) && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Shield className="h-4 w-4 mr-1" />
                {t('nav.admin')}
              </Button>
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-accent text-sm font-medium transition-colors"
            title={locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            {locale === 'vi' ? '🇻🇳' : '🇬🇧'}
            <span className="hidden sm:inline">{locale === 'vi' ? 'VI' : 'EN'}</span>
          </button>

          {/* Cart */}
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Auth */}
          {session?.user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {(session.user as any)?.name ?? (session.user as any)?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => signOut?.()}>
                <LogOut className="h-4 w-4 mr-1" />
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Link href="/auth" className="hidden md:block">
              <Button variant="default" size="sm">
                <User className="h-4 w-4 mr-1" />
                {t('nav.login')}
              </Button>
            </Link>
          )}

          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-t px-4 py-4 space-y-2">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">{t('nav.home')}</Button>
          </Link>
          <Link href="/products" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">{t('nav.products')}</Button>
          </Link>
          <Link href="/orion" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              <Bot className="h-4 w-4 mr-2" />
              Orion
            </Button>
          </Link>
          <Link href="/tin-tuc" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              {t('nav.news')}
            </Button>
          </Link>
          {menuPages.map((p) => (
            <Link key={p.id} href={`/trang/${p.slug}`} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                {locale === 'en' ? p.titleEn || p.title : p.title}
              </Button>
            </Link>
          ))}
          {role === 'admin' && (
            <Link href="/ai-settings" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                {t('nav.ai_settings')}
              </Button>
            </Link>
          )}
          {session?.user && (
            <Link href="/tai-khoan" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                {locale === 'vi' ? 'Đơn hàng của tôi' : 'My Orders'}
              </Button>
            </Link>
          )}
          {session?.user && canUseAiTools(role) && (
            <Link href="/cong-cu-ai" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Sparkles className="h-4 w-4 mr-2" />
                {locale === 'vi' ? 'Công cụ AI' : 'AI Tools'}
              </Button>
            </Link>
          )}
          {session?.user && canAccessAdmin(role) && (
            <Link href="/admin" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                {t('nav.admin')}
              </Button>
            </Link>
          )}
          {session?.user ? (
            <Button variant="ghost" className="w-full justify-start" onClick={() => { signOut?.(); setMobileOpen(false); }}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('nav.logout')}
            </Button>
          ) : (
            <Link href="/auth" onClick={() => setMobileOpen(false)}>
              <Button variant="default" className="w-full">
                <User className="h-4 w-4 mr-2" />
                {t('nav.login')}
              </Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
