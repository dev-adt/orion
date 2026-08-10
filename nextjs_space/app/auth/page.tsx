'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AuthPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signIn?.('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (result?.error) {
          toast.error(t('auth.error'));
        } else {
          toast.success(t('auth.login_success'));
          router.replace('/');
        }
      } else {
        if (form.password !== form.confirmPassword) {
          toast.error('Mật khẩu không khớp');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password, name: form.name }),
        });
        const data = await res.json();
        if (res.ok) {
          // Auto login after signup
          const loginResult = await signIn?.('credentials', {
            email: form.email,
            password: form.password,
            redirect: false,
          });
          if (!loginResult?.error) {
            toast.success(t('auth.signup_success'));
            router.replace('/');
          }
        } else {
          toast.error(data?.error ?? t('common.error'));
        }
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Store className="h-8 w-8 text-primary" />
            <span className="font-display text-2xl font-bold">
              <span className="text-primary">AI</span> Shop
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold">
            {isLogin ? t('auth.welcome') : t('auth.create_account')}
          </h1>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label>{t('auth.name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={form.name}
                    onChange={(e: any) => setForm({ ...form, name: e?.target?.value ?? '' })}
                    placeholder={t('auth.name')}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e: any) => setForm({ ...form, email: e?.target?.value ?? '' })}
                  placeholder="email@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label>{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e: any) => setForm({ ...form, password: e?.target?.value ?? '' })}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label>{t('auth.confirm_password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e: any) => setForm({ ...form, confirmPassword: e?.target?.value ?? '' })}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLogin ? t('auth.login') : t('auth.signup')}
            </Button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? t('auth.no_account') : t('auth.has_account')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
