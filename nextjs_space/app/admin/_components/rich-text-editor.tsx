'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Link2, RemoveFormatting, Quote, Video, Code, Mail,
} from 'lucide-react';
import { toEmbedUrl, isDirectVideoFile } from '@/lib/embed';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_FAMILIES = [
  { label: 'Mặc định', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '40'];

const BLOCKS = [
  { label: 'Đoạn văn', value: 'p' },
  { label: 'Tiêu đề 1', value: 'h1' },
  { label: 'Tiêu đề 2', value: 'h2' },
  { label: 'Tiêu đề 3', value: 'h3' },
  { label: 'Tiêu đề 4', value: 'h4' },
  { label: 'Tiêu đề 5', value: 'h5' },
];

// Convert plain text (with newlines) to simple HTML so the editor shows paragraphs.
function normalizeToHtml(raw: string): string {
  if (!raw) return '';
  const hasBlock = /<(p|div|br|ul|ol|li|h[1-6]|table|blockquote|img|section|article)[\s/>]/i.test(raw);
  if (hasBlock) return raw;
  return raw
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<p>${b.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef<string>('');

  // Initialize / sync external value changes (e.g. AI generation) without disrupting typing.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value !== lastHtml.current) {
      const html = normalizeToHtml(value);
      if (el.innerHTML !== html) {
        el.innerHTML = html;
      }
      lastHtml.current = value;
    }
  }, [value]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    lastHtml.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback((command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, arg);
    emit();
  }, [emit]);

  const formatBlock = useCallback((tag: string) => {
    if (!tag) return;
    ref.current?.focus();
    document.execCommand('formatBlock', false, `<${tag}>`);
    emit();
  }, [emit]);

  const setFontFamily = useCallback((family: string) => {
    if (!family) return;
    ref.current?.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('fontName', false, family);
    emit();
  }, [emit]);

  // Apply an arbitrary px font-size to the selection using the fontSize trick.
  const setFontSize = useCallback((px: string) => {
    const el = ref.current;
    if (!el || !px) return;
    el.focus();
    document.execCommand('fontSize', false, '7');
    el.querySelectorAll('font[size="7"]').forEach((node) => {
      const font = node as HTMLElement;
      font.removeAttribute('size');
      font.style.fontSize = `${px}px`;
    });
    emit();
  }, [emit]);

  const addLink = useCallback(() => {
    const url = window.prompt('Nhập đường link (URL):', 'https://');
    if (url) exec('createLink', url);
  }, [exec]);

  const insertHtml = useCallback((html: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand('insertHTML', false, html + '<p><br/></p>');
    emit();
  }, [emit]);

  const addVideo = useCallback(() => {
    const url = window.prompt('Dán link video (YouTube, Vimeo hoặc MP4):', 'https://');
    if (!url) return;
    const src = toEmbedUrl(url);
    if (!src) return;
    const inner = isDirectVideoFile(url)
      ? '<video src="' + url + '" controls style="position:absolute;inset:0;width:100%;height:100%;"></video>'
      : '<iframe src="' + src + '" title="video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe>';
    insertHtml('<div style="position:relative;width:100%;padding-top:56.25%;margin:1rem 0;border-radius:12px;overflow:hidden;background:#000;">' + inner + '</div>');
  }, [insertHtml]);

  const addEmbed = useCallback(() => {
    const code = window.prompt('Dán mã nhúng (HTML / iframe):', '');
    if (code && code.trim()) insertHtml('<div class="rte-embed" style="margin:1rem 0;">' + code.trim() + '</div>');
  }, [insertHtml]);

  const addContactForm = useCallback(() => {
    insertHtml('<p>[contact-form]</p>');
  }, [insertHtml]);

  const btn = 'h-8 min-w-8 px-2 inline-flex items-center justify-center rounded hover:bg-muted text-foreground transition-colors';
  const selCls = 'h-8 rounded border bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary';
  const sep = <span className="w-px h-6 bg-border mx-1" />;

  return (
    <div className="border rounded-lg overflow-hidden bg-background flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5 sticky top-0 z-10">
        {/* Block / heading level */}
        <select
          className={selCls}
          title="Định dạng đoạn / tiêu đề"
          defaultValue=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { formatBlock(e.target.value); e.target.value = ''; }}
        >
          <option value="" disabled>Định dạng</option>
          {BLOCKS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>

        {/* Font family */}
        <select
          className={selCls}
          title="Loại font chữ"
          defaultValue=""
          onChange={(e) => { setFontFamily(e.target.value); e.target.value = ''; }}
        >
          <option value="" disabled>Font chữ</option>
          {FONT_FAMILIES.filter((f) => f.value).map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Font size */}
        <select
          className={selCls}
          title="Cỡ chữ"
          defaultValue=""
          onChange={(e) => { setFontSize(e.target.value); e.target.value = ''; }}
        >
          <option value="" disabled>Cỡ chữ</option>
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
        </select>
        {sep}
        <button type="button" className={btn} title="Đậm" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}><Bold className="h-4 w-4" /></button>
        <button type="button" className={btn} title="Nghiêng" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}><Italic className="h-4 w-4" /></button>
        <button type="button" className={btn} title="Gạch chân" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}><Underline className="h-4 w-4" /></button>
        <button type="button" className={btn} title="Gạch ngang" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('strikeThrough')}><Strikethrough className="h-4 w-4" /></button>
        {sep}
        <button type="button" className={btn} title="Danh sách chấm" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}><List className="h-4 w-4" /></button>
        <button type="button" className={btn} title="Danh sách số" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}><ListOrdered className="h-4 w-4" /></button>
        <button type="button" className={btn} title="Trích dẫn" onMouseDown={(e) => e.preventDefault()} onClick={() => formatBlock('blockquote')}><Quote className="h-4 w-4" /></button>
        {sep}
        <button type="button" className={btn} title="Chèn link" onMouseDown={(e) => e.preventDefault()} onClick={addLink}><Link2 className="h-4 w-4" /></button>
        <button type="button" className={btn} title="Chèn video (YouTube/Vimeo/MP4)" onMouseDown={(e) => e.preventDefault()} onClick={addVideo}><Video className="h-4 w-4" /></button>
        <button type="button" className={btn} title="Chèn mã nhúng (embed)" onMouseDown={(e) => e.preventDefault()} onClick={addEmbed}><Code className="h-4 w-4" /></button>
        <button type="button" className={btn} title="Chèn biểu mẫu liên hệ (Contact)" onMouseDown={(e) => e.preventDefault()} onClick={addContactForm}><Mail className="h-4 w-4" /></button>
        <button type="button" className={btn} title="Xóa định dạng" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('removeFormat')}><RemoveFormatting className="h-4 w-4" /></button>
      </div>

      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder || 'Nhập nội dung...'}
        className="rte-content prose prose-sm max-w-none min-h-[45vh] max-h-[60vh] overflow-y-auto p-4 focus:outline-none"
      />

      <style jsx global>{`
        .rte-content:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        .rte-content h1 { font-size: 1.8rem; font-weight: 700; margin: 0.6em 0 0.3em; }
        .rte-content h2 { font-size: 1.5rem; font-weight: 700; margin: 0.6em 0 0.3em; }
        .rte-content h3 { font-size: 1.25rem; font-weight: 600; margin: 0.5em 0 0.3em; }
        .rte-content h4 { font-size: 1.1rem; font-weight: 600; margin: 0.5em 0 0.3em; }
        .rte-content h5 { font-size: 1rem; font-weight: 600; margin: 0.5em 0 0.3em; }
        .rte-content p { margin: 0.4em 0; }
        .rte-content ul { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
        .rte-content ol { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
        .rte-content blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1em; color: hsl(var(--muted-foreground)); margin: 0.5em 0; }
        .rte-content a { color: hsl(var(--primary)); text-decoration: underline; }
      `}</style>
    </div>
  );
}
