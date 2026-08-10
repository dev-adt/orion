'use client';

import { useTranslation } from '@/lib/i18n-context';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/app/_components/contact-form';
import { defaultContactFields, type PageBlock } from '@/lib/page-blocks';
import { PageRenderer } from '@/app/_components/page-renderer';

interface Props {
  post: any;
  blocks?: PageBlock[];
  productsByBlock?: Record<string, any[]>;
  postsByBlock?: Record<string, any[]>;
  categories?: any[];
}

// If content contains real HTML block tags, render as-is.
// Otherwise treat plain text: blank lines -> paragraphs, single newlines -> <br>.
function formatContent(raw: string): string {
  const hasBlockHtml = /<(p|div|br|ul|ol|li|h[1-6]|table|blockquote|img|section|article)[\s/>]/i.test(raw);
  if (hasBlockHtml) return raw;
  const blocks = raw
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<p>${b.replace(/\n/g, '<br/>')}</p>`);
  return blocks.join('');
}

export function PostDetailClient({ post, blocks = [], productsByBlock, postsByBlock, categories }: Props) {
  const { locale } = useTranslation();

  const title = locale === 'en' ? (post.titleEn ?? post.title) : post.title;
  const rawContent = locale === 'en' ? (post.contentEn ?? post.content) : post.content;
  const content = formatContent(rawContent || '');

  return (
    <div className="max-w-[800px] mx-auto px-4 py-12">
      {/* Custom CSS */}
      {post.customCss ? <style dangerouslySetInnerHTML={{ __html: post.customCss }} /> : null}

      {/* Custom header */}
      {post.headerHtml ? <div className="mb-6" dangerouslySetInnerHTML={{ __html: post.headerHtml }} /> : null}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">{locale === 'vi' ? 'Trang chủ' : 'Home'}</Link>
        <span>/</span>
        <Link href="/tin-tuc" className="hover:text-primary">{locale === 'vi' ? 'Tin tức' : 'News'}</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{title}</span>
      </div>

      {/* Title */}
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
        {title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {new Date(post.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        {post.author?.name && (
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {post.author.name}
          </span>
        )}
      </div>

      {/* Cover image */}
      {post.image && (
        <div className="relative aspect-video bg-muted rounded-xl overflow-hidden mb-8">
          <Image
            src={post.image}
            alt={title}
            fill
            className="object-cover"
            sizes="800px"
            priority
          />
        </div>
      )}

      {/* Content (supports [contact-form] shortcode) */}
      {content.replace(/<p>\s*\[contact-form\]\s*<\/p>/gi, '[contact-form]').split(/\[contact-form\]/i).map((part, i, arr) => (
        <div key={i}>
          <div
            className="prose prose-lg max-w-none prose-headings:font-display prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: part }}
          />
          {i < arr.length - 1 ? (
            <div className="my-8">
              <ContactForm
                fields={defaultContactFields()}
                title={locale === 'vi' ? 'Liên hệ với chúng tôi' : 'Contact us'}
                subtitle={locale === 'vi' ? 'Để lại thông tin, chúng tôi sẽ liên hệ lại sớm nhất.' : 'Leave your details and we will contact you soon.'}
                submitText={locale === 'vi' ? 'Gửi' : 'Send'}
                source={'Bài viết: ' + title}
              />
            </div>
          ) : null}
        </div>
      ))}

      {/* Advanced content blocks (like Pages) */}
      {blocks && blocks.length > 0 ? (
        <div className="mt-10 -mx-4">
          <PageRenderer blocks={blocks} productsByBlock={productsByBlock} postsByBlock={postsByBlock} categories={categories} />
        </div>
      ) : null}

      {/* Custom footer */}
      {post.footerHtml ? <div className="mt-10" dangerouslySetInnerHTML={{ __html: post.footerHtml }} /> : null}

      {/* Back */}
      <div className="mt-12 pt-8 border-t">
        <Link href="/tin-tuc">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {locale === 'vi' ? 'Quay lại danh sách' : 'Back to all posts'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
