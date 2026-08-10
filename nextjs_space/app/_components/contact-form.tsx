'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ContactField } from '@/lib/page-blocks';

interface Props {
  fields: ContactField[];
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  submitText?: string;
  submitTextEn?: string;
  successText?: string;
  successTextEn?: string;
  source?: string;
  /** Whether to show * next to required field labels. Defaults to true. */
  showRequired?: boolean;
  /** URL to redirect to after successful submission (Thank-you page). */
  thankYouUrl?: string;
}

export function ContactForm({
  fields,
  title,
  titleEn,
  subtitle,
  subtitleEn,
  submitText,
  submitTextEn,
  successText,
  successTextEn,
  source,
  showRequired = true,
  thankYouUrl,
}: Props) {
  const { locale } = useTranslation();
  const isVi = locale === 'vi';
  const pick = (vi?: string, en?: string) => (isVi ? vi : en || vi) || '';

  const list: ContactField[] = Array.isArray(fields) && fields.length > 0 ? fields : [];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    list.forEach((f) => { init[f.key] = f.placeholder && f.type === 'tel' ? f.placeholder : ''; });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const setVal = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // validate required
    for (const f of list) {
      if (f.required && !(values[f.key] || '').trim()) {
        toast.error(isVi ? `Vui lòng nhập "${f.label}"` : `Please fill in "${f.labelEn || f.label}"`);
        return;
      }
    }
    setSubmitting(true);
    try {
      // Build labelled data map so the CRM shows field names.
      const data: Record<string, string> = {};
      list.forEach((f) => {
        const v = (values[f.key] || '').trim();
        if (v) data[f.label] = v;
      });
      const payload = {
        name: values['name'] || values['fullName'] || values['ten'] || '',
        email: values['email'] || '',
        phone: values['phone'] || values['sdt'] || '',
        company: values['company'] || '',
        message: values['message'] || values['question'] || '',
        data,
        source: source || '',
        sourceUrl: typeof window !== 'undefined' ? window.location.pathname : '',
      };
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('failed');
      // Redirect to thank-you page if configured, otherwise show inline success
      if (thankYouUrl && thankYouUrl.trim()) {
        window.location.href = thankYouUrl.trim();
        return;
      }
      setDone(true);
    } catch {
      toast.error(isVi ? 'Gửi không thành công, vui lòng thử lại.' : 'Submission failed, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

  if (done) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <p className="text-base font-medium">
          {pick(successText, successTextEn) ||
            (isVi ? 'Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm.' : 'Thank you! We will contact you soon.')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 md:p-8 shadow-sm">
      {pick(title, titleEn) ? (
        <h3 className="font-display text-xl md:text-2xl font-bold mb-1">{pick(title, titleEn)}</h3>
      ) : null}
      {pick(subtitle, subtitleEn) ? (
        <p className="text-sm text-muted-foreground mb-5">{pick(subtitle, subtitleEn)}</p>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        {list.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium mb-1">
              {pick(f.label, f.labelEn)}
              {showRequired && f.required ? <span className="text-red-500"> *</span> : null}
            </label>
            {f.type === 'textarea' ? (
              <textarea
                className={inputCls}
                rows={4}
                value={values[f.key] || ''}
                onChange={(e) => setVal(f.key, e.target.value)}
                placeholder={f.placeholder || ''}
              />
            ) : f.type === 'select' ? (
              <select className={inputCls} value={values[f.key] || ''} onChange={(e) => setVal(f.key, e.target.value)}>
                <option value="">{isVi ? '-- Chọn --' : '-- Select --'}</option>
                {(f.options || []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                type={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                className={inputCls}
                value={values[f.key] || ''}
                onChange={(e) => setVal(f.key, e.target.value)}
                placeholder={f.placeholder || ''}
              />
            )}
          </div>
        ))}
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pick(submitText, submitTextEn) || (isVi ? 'Gửi' : 'Send')}
        </Button>
      </form>
    </div>
  );
}
