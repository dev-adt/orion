'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-context';
import { defaultFooterConfig, parseFooterConfig, FOOTER_SETTING_KEY, type FooterConfig } from '@/lib/footer-config';

export function Footer() {
  const { locale } = useTranslation();
  const isVi = locale === 'vi';
  const pick = (vi?: string, en?: string) => (isVi ? vi : en || vi) || '';

  const [cfg, setCfg] = useState<FooterConfig>(() => defaultFooterConfig());

  useEffect(() => {
    let active = true;
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const raw = d?.settings?.[FOOTER_SETTING_KEY];
        if (raw) setCfg(parseFooterConfig(raw));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const isExternal = (url: string) => /^https?:\/\//i.test(url);

  return (
    <footer className="bg-muted/50 border-t mt-16">
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-xl mb-3">
              <Image src="/logo.png" alt="Orion" width={120} height={40} className="object-contain h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground">{pick(cfg.description, cfg.descriptionEn)}</p>
          </div>

          {/* Link columns */}
          {(cfg.columns || []).map((col, ci) => (
            <div key={ci}>
              <h3 className="font-display font-semibold mb-3">{pick(col.title, col.titleEn)}</h3>
              <ul className="space-y-2 text-sm">
                {(col.links || []).map((lnk, li) => (
                  <li key={li}>
                    {isExternal(lnk.url) ? (
                      <a
                        href={lnk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {pick(lnk.label, lnk.labelEn)}
                      </a>
                    ) : (
                      <Link href={lnk.url || '#'} className="text-muted-foreground hover:text-primary transition-colors">
                        {pick(lnk.label, lnk.labelEn)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold mb-3">{pick(cfg.contactTitle, cfg.contactTitleEn)}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {cfg.email ? (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" /> <span suppressHydrationWarning>{cfg.email}</span>
                </li>
              ) : null}
              {cfg.phone ? (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" /> <span suppressHydrationWarning>{cfg.phone}</span>
                </li>
              ) : null}
              {(isVi ? cfg.address : cfg.addressEn || cfg.address) ? (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" /> {pick(cfg.address, cfg.addressEn)}
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          {pick(cfg.copyright, cfg.copyrightEn)}
        </div>
      </div>
    </footer>
  );
}
