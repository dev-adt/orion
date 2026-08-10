'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import {
  Bot, Save, Loader2, Upload, FileText, Trash2, Sparkles, Globe, BookOpen, Check,
  Cpu, TrendingDown, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const PROVIDERS = [
  { id: 'router', name: 'AI Router (Tự động tiết kiệm)', models: ['auto'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic Claude', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'] },
  { id: 'google', name: 'Google Gemini', models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'] },
  { id: 'deepseek', name: 'Deepseek', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'openrouter', name: 'OpenRouter', models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-flash-1.5', 'meta-llama/llama-3.1-70b-instruct'] },
  { id: 'abacus', name: 'Abacus AI', models: ['route-llm', 'gpt-4o', 'claude-3-5-sonnet'] },
];

function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function AiTraining() {
  const { locale } = useTranslation();
  const vi = locale === 'vi';
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [useWebsiteData, setUseWebsiteData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [usage, setUsage] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const activeProvider = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];
  const isRouter = provider === 'router';

  const loadUsage = async () => {
    setUsageLoading(true);
    try {
      const res = await fetch('/api/admin/ai-usage');
      if (res.ok) setUsage(await res.json());
    } catch {}
    setUsageLoading(false);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cfgRes, docRes] = await Promise.all([
          fetch('/api/admin/ai-config'),
          fetch('/api/admin/knowledge'),
        ]);
        if (cfgRes.ok) {
          const { config } = await cfgRes.json();
          if (config) {
            setProvider(config.provider ?? 'openai');
            setModel(config.model ?? 'gpt-4o-mini');
            setSystemPrompt(config.systemPrompt ?? '');
            setUseWebsiteData(config.useWebsiteData !== false);
          }
        }
        if (docRes.ok) {
          const { docs } = await docRes.json();
          setDocs(docs ?? []);
        }
      } catch {}
      setLoading(false);
      loadUsage();
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, systemPrompt, useWebsiteData }),
      });
      if (res.ok) toast.success(vi ? 'Đã lưu cấu hình trợ lý!' : 'Assistant config saved!');
      else toast.error(vi ? 'Lưu thất bại' : 'Save failed');
    } catch {
      toast.error(vi ? 'Lưu thất bại' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        if (!text.trim()) continue;
        const res = await fetch('/api/admin/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^.]+$/, ''),
            fileName: file.name,
            content: text,
          }),
        });
        if (res.ok) {
          const { doc } = await res.json();
          setDocs((prev) => [{ ...doc, size: text.length }, ...prev]);
          ok++;
        }
      } catch {}
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    if (ok > 0) toast.success(vi ? `Đã thêm ${ok} tài liệu` : `Added ${ok} document(s)`);
    else toast.error(vi ? 'Không thể đọc tệp' : 'Could not read file(s)');
  };

  const deleteDoc = async (id: string) => {
    if (!confirm(vi ? 'Xóa tài liệu này khỏi kiến thức?' : 'Remove this document?')) return;
    try {
      await fetch(`/api/admin/knowledge/${id}`, { method: 'DELETE' });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success(vi ? 'Đã xóa' : 'Deleted');
    } catch {
      toast.error(vi ? 'Xóa thất bại' : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fmt = (n: number) =>
    '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

  return (
    <div className="space-y-6">
      {/* Cost-savings dashboard (AI Router) */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-emerald-600" />
            {vi ? 'Tiết kiệm chi phí AI (Router)' : 'AI cost savings (Router)'}
          </h3>
          <Button variant="ghost" size="sm" onClick={loadUsage} disabled={usageLoading} className="h-8 gap-1.5 text-xs">
            {usageLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {vi ? 'Làm mới' : 'Refresh'}
          </Button>
        </div>
        {!usage || usage?.totalRequests === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {vi
              ? 'Chưa có dữ liệu. Bật "AI Router" và trò chuyện với trợ lý để bắt đầu ghi nhận mức tiết kiệm.'
              : 'No data yet. Enable "AI Router" and chat with the assistant to start tracking savings.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
                <p className="text-2xl font-bold text-emerald-600">{(usage.savingsPct ?? 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{vi ? 'Tiết kiệm so với GPT-4o' : 'Saved vs GPT-4o'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{usage.totalRequests}</p>
                <p className="text-xs text-muted-foreground">{vi ? 'Tổng lượt hỏi' : 'Total requests'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-lg font-bold">{fmt(usage.totalCost)}</p>
                <p className="text-xs text-muted-foreground">{vi ? 'Chi phí thực tế' : 'Actual cost'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-lg font-bold text-muted-foreground line-through">{fmt(usage.totalBaseline)}</p>
                <p className="text-xs text-muted-foreground">{vi ? 'Nếu chỉ dùng GPT-4o' : 'If GPT-4o only'}</p>
              </div>
            </div>
            {usage.byModel && Object.keys(usage.byModel).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">{vi ? 'Theo model' : 'By model'}</p>
                <div className="space-y-1.5">
                  {Object.entries(usage.byModel as Record<string, { count: number; cost: number }>)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([m, v]) => (
                      <div key={m} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs">{m}</span>
                        <span className="text-muted-foreground text-xs">{v.count} {vi ? 'lượt' : 'reqs'} · {fmt(v.cost)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: brain config */}
      <div className="space-y-5 bg-card rounded-xl border p-6">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {vi ? 'Cấu hình trợ lý' : 'Assistant configuration'}
        </h3>

        {/* Provider */}
        <div>
          <Label>{vi ? 'Nhà cung cấp' : 'Provider'}</Label>
          <select
            value={provider}
            onChange={(e: any) => {
              const pid = e?.target?.value;
              setProvider(pid);
              const p = PROVIDERS.find((x) => x.id === pid);
              if (pid === 'router') setModel('auto');
              else if (p && !p.models.includes(model)) setModel(p.models[0]);
            }}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {isRouter
              ? (vi
                  ? 'AI Router dùng các khóa API bạn đã lưu ở trang AI Settings (OpenAI, Google/Gemini, Anthropic).'
                  : 'AI Router uses the API keys you saved on the AI Settings page (OpenAI, Google/Gemini, Anthropic).')
              : (vi
                  ? 'API key của nhà cung cấp này được nhập ở trang AI Settings.'
                  : 'The API key for this provider is entered on the AI Settings page.')}
          </p>
        </div>

        {isRouter ? (
          /* Router explanation instead of a manual model field */
          <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2 text-violet-700 dark:text-violet-300">
              <Cpu className="h-4 w-4" />
              {vi ? 'Chọn model tự động' : 'Automatic model selection'}
            </p>
            <p className="text-xs text-muted-foreground">
              {vi
                ? 'Router tự phân loại độ khó mỗi câu hỏi và chọn model rẻ nhất phù hợp: câu đơn giản → Gemini Flash (rẻ nhất), trung bình → GPT-4o Mini, phức tạp → Claude/GPT-4o. Nếu một model lỗi, hệ thống tự chuyển sang model dự phòng. Bạn không cần chọn model thủ công.'
                : 'The router classifies each question and picks the cheapest capable model: simple → Gemini Flash (cheapest), medium → GPT-4o Mini, complex → Claude/GPT-4o. If a model fails it falls back automatically. No manual model selection needed.'}
            </p>
          </div>
        ) : (
          /* Model */
          <div>
            <Label>Model</Label>
            <Input
              list="train-models"
              value={model}
              onChange={(e: any) => setModel(e?.target?.value ?? '')}
              placeholder={activeProvider.models[0]}
            />
            <datalist id="train-models">
              {activeProvider.models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
        )}

        {/* System prompt */}
        <div>
          <Label>{vi ? 'System Prompt (tính cách & vai trò)' : 'System Prompt (persona & role)'}</Label>
          <Textarea
            value={systemPrompt}
            onChange={(e: any) => setSystemPrompt(e?.target?.value ?? '')}
            rows={8}
            placeholder={
              vi
                ? 'VD: Bạn là trợ lý bán hàng của Orion, luôn thân thiện, tư vấn sản phẩm phù hợp nhất và kèm link sản phẩm...'
                : 'e.g. You are the sales assistant of Orion, always friendly, recommend the best products with links...'
            }
          />
        </div>

        {/* Website data toggle */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useWebsiteData}
            onChange={(e: any) => setUseWebsiteData(!!e?.target?.checked)}
            className="mt-1 h-4 w-4"
          />
          <span className="text-sm">
            <span className="font-medium flex items-center gap-1">
              <Globe className="h-4 w-4" /> {vi ? 'Đọc dữ liệu trang web' : 'Read website data'}
            </span>
            <span className="text-muted-foreground">
              {vi
                ? 'Tự động nạp danh sách sản phẩm & bài viết (kèm link) để trợ lý trả lời chính xác.'
                : 'Automatically load products & posts (with links) so the assistant answers accurately.'}
            </span>
          </span>
        </label>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {vi ? 'Lưu cấu hình' : 'Save configuration'}
        </Button>
      </div>

      {/* Right: knowledge base */}
      <div className="space-y-4 bg-card rounded-xl border p-6">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {vi ? 'Kiến thức (Knowledge)' : 'Knowledge base'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {vi
            ? 'Tải lên các tệp .md để bổ sung kiến thức riêng (chính sách, hướng dẫn, FAQ...). Trợ lý sẽ dùng nội dung này để trả lời.'
            : 'Upload .md files to add custom knowledge (policies, guides, FAQs...). The assistant will use them to answer.'}
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          ) : (
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          )}
          <p className="text-sm font-medium">{vi ? 'Kéo thả hoặc bấm để tải tệp .md' : 'Drag & drop or click to upload .md files'}</p>
          <p className="text-xs text-muted-foreground">.md, .markdown, .txt</p>
        </div>

        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {docs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              {vi ? 'Chưa có tài liệu kiến thức nào' : 'No knowledge documents yet'}
            </p>
          ) : (
            docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.fileName ?? ''} {typeof d.size === 'number' ? `· ${formatSize(d.size)}` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {docs.length > 0 && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />
            {vi ? `${docs.length} tài liệu đang được dùng làm kiến thức` : `${docs.length} document(s) active as knowledge`}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
