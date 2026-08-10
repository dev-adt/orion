'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/lib/i18n-context';
import { motion } from 'framer-motion';
import {
  Bot, Settings, Eye, EyeOff, Save, Trash2, Zap, Check, X, ExternalLink, Loader2,
  Sparkles, Brain, Globe, Cpu, Network, Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Providers the AI Router can route between (keys read from the per-provider map).
const ROUTER_SUPPORTED = [
  { keyId: 'google', label: 'Google Gemini', tier: { vi: 'Câu đơn giản (rẻ nhất)', en: 'Simple (cheapest)' } },
  { keyId: 'openai', label: 'OpenAI', tier: { vi: 'Trung bình & phức tạp', en: 'Medium & complex' } },
  { keyId: 'anthropic', label: 'Anthropic Claude', tier: { vi: 'Phức tạp (suy luận)', en: 'Complex (reasoning)' } },
];

// AI Provider definitions - easy to extend
const AI_PROVIDERS = [
  {
    id: 'router',
    name: 'AI Router',
    icon: Cpu,
    color: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
    active: true,
    isRouter: true,
    models: ['auto'],
    helpUrl: '',
    description: { vi: 'Tự động chọn model rẻ nhất', en: 'Auto-pick cheapest model' },
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Bot,
    color: 'bg-green-500',
    active: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    helpUrl: 'https://platform.openai.com/api-keys',
    description: { vi: 'GPT-4o, GPT-3.5 Turbo', en: 'GPT-4o, GPT-3.5 Turbo' },
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: Brain,
    color: 'bg-orange-500',
    active: true,
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-sonnet-4-20250514', 'claude-3-haiku-20240307'],
    helpUrl: 'https://console.anthropic.com/settings/keys',
    description: { vi: 'Claude Sonnet, Haiku', en: 'Claude Sonnet, Haiku' },
  },
  {
    id: 'google',
    name: 'Google Gemini',
    icon: Sparkles,
    color: 'bg-blue-500',
    active: true,
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
    helpUrl: 'https://aistudio.google.com/app/apikey',
    description: { vi: 'Gemini Pro, Flash', en: 'Gemini Pro, Flash' },
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    icon: Globe,
    color: 'bg-cyan-500',
    active: true,
    models: ['deepseek-chat', 'deepseek-reasoner'],
    helpUrl: 'https://platform.deepseek.com/api_keys',
    description: { vi: 'Deepseek Chat, Reasoner', en: 'Deepseek Chat, Reasoner' },
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: Network,
    color: 'bg-purple-500',
    active: true,
    models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-flash-1.5', 'meta-llama/llama-3.1-70b-instruct'],
    helpUrl: 'https://openrouter.ai/keys',
    description: { vi: 'Truy cập nhiều model', en: 'Multi-model access' },
  },
  {
    id: 'nvidia',
    name: 'Nvidia NIM',
    icon: Cpu,
    color: 'bg-[#76B900]',
    active: true,
    models: ['nvidia/llama-3.1-nemotron-70b-instruct', 'meta/llama-3.3-70b-instruct', 'deepseek-ai/deepseek-r1'],
    helpUrl: 'https://build.nvidia.com/',
    description: { vi: 'Nvidia NIM, Nemotron', en: 'Nvidia NIM, Nemotron' },
  },
  {
    id: 'kimi',
    name: 'Kimi K3',
    icon: Sparkles,
    color: 'bg-gradient-to-br from-sky-500 to-indigo-600',
    active: true,
    models: ['kimi-k2-0711-preview', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    helpUrl: 'https://platform.moonshot.ai/console/api-keys',
    description: { vi: 'Moonshot AI, Kimi K2', en: 'Moonshot AI, Kimi K2' },
  },
  {
    id: 'abacus',
    name: 'Abacus AI',
    icon: Server,
    color: 'bg-indigo-500',
    active: true,
    models: ['route-llm', 'gpt-4o', 'claude-3-5-sonnet'],
    helpUrl: 'https://abacus.ai',
    description: { vi: 'Nền tảng AI tổng hợp', en: 'Comprehensive AI platform' },
  },
];

export default function AISettingsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const role = (session?.user as any)?.role;
  const isAdmin = role === 'admin';

  // Only admins may access AI settings. Redirect everyone else away.
  useEffect(() => {
    if (status === 'loading') return;
    if (!isAdmin) router.replace('/');
  }, [status, isAdmin, router]);

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savedConfig, setSavedConfig] = useState<any>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});

  const isRouter = selectedProvider === 'router';

  const refreshSavedKeys = () => {
    try { setSavedKeys(JSON.parse(localStorage.getItem('ai_keys') || '{}')); } catch { setSavedKeys({}); }
  };

  // Load the last-active provider on mount. The actual key/model/prompt fields
  // are populated by the provider-change effect below (per-provider storage),
  // so switching providers always shows THAT provider's own saved values.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai_settings');
      if (stored) {
        const config = JSON.parse(stored);
        setSavedConfig(config);
        if (config?.provider) setSelectedProvider(config.provider);
      }
    } catch {}
    refreshSavedKeys();
  }, []);

  const activeProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider);

  // Whenever the selected provider changes, load THAT provider's own saved
  // key/model/prompt from the per-provider maps (falling back to the last
  // active ai_settings if it matches). This fixes the bug where clicking a
  // different provider still showed the previous provider's key & model.
  useEffect(() => {
    setFetchedModels([]);
    setShowKey(false);
    if (!selectedProvider) {
      setApiKey('');
      setModel('');
      setSystemPrompt('');
      return;
    }
    let keys: any = {}, models: any = {}, prompts: any = {};
    try { keys = JSON.parse(localStorage.getItem('ai_keys') || '{}'); } catch {}
    try { models = JSON.parse(localStorage.getItem('ai_models') || '{}'); } catch {}
    try { prompts = JSON.parse(localStorage.getItem('ai_prompts') || '{}'); } catch {}
    let last: any = null;
    try { last = JSON.parse(localStorage.getItem('ai_settings') || 'null'); } catch {}
    const fromLast = last && last.provider === selectedProvider ? last : null;
    setApiKey(keys[selectedProvider] ?? fromLast?.apiKey ?? '');
    setModel(models[selectedProvider] ?? fromLast?.model ?? '');
    setSystemPrompt(prompts[selectedProvider] ?? fromLast?.systemPrompt ?? '');
  }, [selectedProvider]);

  const handleLoadModels = async () => {
    if (!apiKey?.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng nhập API Key trước' : 'Please enter API Key first');
      return;
    }
    setLoadingModels(true);
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 30000);
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        signal: ac.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': selectedProvider || 'openai',
          'x-ai-key': apiKey.trim(),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data?.models) && data.models.length > 0) {
        setFetchedModels(data.models);
        if (!model && data.models[0]) setModel(data.models[0]);
        toast.success(
          locale === 'vi'
            ? `Đã tải ${data.models.length} model khả dụng`
            : `Loaded ${data.models.length} available models`,
        );
      } else {
        toast.error(
          locale === 'vi'
            ? 'Không tải được danh sách model. Kiểm tra lại API Key.'
            : 'Could not load models. Please check your API Key.',
        );
      }
    } catch {
      toast.error(
        locale === 'vi' ? 'Không tải được danh sách model.' : 'Could not load models.',
      );
    } finally {
      clearTimeout(to);
      setLoadingModels(false);
    }
  };

  const handleSave = async () => {
    // --- AI Router: no single key. Activate as the assistant provider using
    // the already-saved per-provider keys. Also update the server "brain" so
    // the chatbot uses the router (preserving the trained prompt & knowledge). ---
    if (isRouter) {
      const present = Object.entries(savedKeys).filter(([, v]) => !!v).map(([k]) => k);
      const routerable = present.filter((k) => ['openai', 'google', 'anthropic'].includes(k));
      if (routerable.length === 0) {
        toast.error(
          locale === 'vi'
            ? 'Cần lưu ít nhất một khóa: OpenAI, Google/Gemini hoặc Anthropic trước khi bật Router.'
            : 'Save at least one key (OpenAI, Google/Gemini or Anthropic) before enabling the Router.',
        );
        return;
      }
      const config = { provider: 'router', apiKey: '', model: 'auto', systemPrompt: '' };
      localStorage.setItem('ai_settings', JSON.stringify(config));
      setSavedConfig(config);
      // Best-effort: flip the server assistant to router, keeping existing prompt.
      try {
        const cur = await fetch('/api/admin/ai-config').then((r) => (r.ok ? r.json() : null)).catch(() => null);
        const c = cur?.config;
        await fetch('/api/admin/ai-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'router',
            model: 'auto',
            systemPrompt: c?.systemPrompt ?? '',
            useWebsiteData: c?.useWebsiteData !== false,
          }),
        });
      } catch {}
      toast.success(
        locale === 'vi'
          ? `Đã bật AI Router (đang dùng ${routerable.length} nhà cung cấp).`
          : `AI Router enabled (using ${routerable.length} provider(s)).`,
      );
      return;
    }

    if (!apiKey?.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng nhập API Key' : 'Please enter API Key');
      return;
    }
    const resolvedModel = model || activeProvider?.models?.[0] || 'gpt-4o-mini';
    const resolvedPrompt = systemPrompt || t('ai.default_prompt');
    const config = {
      provider: selectedProvider,
      apiKey: apiKey.trim(),
      model: resolvedModel,
      systemPrompt: resolvedPrompt,
    };
    // ai_settings = the currently active provider (used as the default elsewhere).
    localStorage.setItem('ai_settings', JSON.stringify(config));
    // Persist key/model/prompt PER PROVIDER so each provider keeps its own values.
    try {
      const keys = JSON.parse(localStorage.getItem('ai_keys') || '{}');
      const models = JSON.parse(localStorage.getItem('ai_models') || '{}');
      const prompts = JSON.parse(localStorage.getItem('ai_prompts') || '{}');
      if (selectedProvider) {
        keys[selectedProvider] = apiKey.trim();
        models[selectedProvider] = resolvedModel;
        prompts[selectedProvider] = resolvedPrompt;
      }
      localStorage.setItem('ai_keys', JSON.stringify(keys));
      localStorage.setItem('ai_models', JSON.stringify(models));
      localStorage.setItem('ai_prompts', JSON.stringify(prompts));
    } catch {}
    setSavedConfig(config);
    refreshSavedKeys();
    toast.success(t('ai.saved'));
  };

  const handleClear = () => {
    // Clear only the currently selected provider's stored values.
    try {
      const keys = JSON.parse(localStorage.getItem('ai_keys') || '{}');
      const models = JSON.parse(localStorage.getItem('ai_models') || '{}');
      const prompts = JSON.parse(localStorage.getItem('ai_prompts') || '{}');
      if (selectedProvider) {
        delete keys[selectedProvider];
        delete models[selectedProvider];
        delete prompts[selectedProvider];
      }
      localStorage.setItem('ai_keys', JSON.stringify(keys));
      localStorage.setItem('ai_models', JSON.stringify(models));
      localStorage.setItem('ai_prompts', JSON.stringify(prompts));
    } catch {}
    // If the active config belongs to this provider, drop it too.
    try {
      const last = JSON.parse(localStorage.getItem('ai_settings') || 'null');
      if (last?.provider === selectedProvider) {
        localStorage.removeItem('ai_settings');
        setSavedConfig(null);
      }
    } catch {}
    setApiKey('');
    setModel('');
    setSystemPrompt('');
    setFetchedModels([]);
    refreshSavedKeys();
    toast.success(t('ai.cleared'));
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-ai-provider': selectedProvider || 'openai',
      };
      if (isRouter) {
        const present: Record<string, string> = {};
        for (const [k, v] of Object.entries(savedKeys)) { if (v) present[k] = v as string; }
        if (Object.keys(present).length === 0) { setTesting(false); return; }
        try {
          headers['x-ai-keys'] = btoa(unescape(encodeURIComponent(JSON.stringify(present))));
        } catch {}
      } else {
        if (!apiKey?.trim()) { setTesting(false); return; }
        headers['x-ai-key'] = apiKey;
        headers['x-ai-model'] = model || activeProvider?.models?.[0] || 'gpt-4o-mini';
      }
      // Client-side timeout so the button can never spin forever even if the
      // network stalls or the browser's connection pool is saturated.
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), 30000);
      let res: Response;
      try {
        res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers,
          signal: ac.signal,
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Hi, reply with just "OK" to confirm the connection works.' }],
            systemPrompt: 'Reply only with OK.',
          }),
        });
      } finally {
        clearTimeout(to);
      }
      if (res.ok) {
        // CRITICAL: the success response is a streaming SSE body. If we don't
        // release it, the abandoned stream holds a browser connection open;
        // after a few tests the per-host connection limit is exhausted and every
        // later request (test / load models) hangs forever. Cancel it now.
        try { await res.body?.cancel(); } catch {}
        toast.success(t('ai.test_success'));
      } else {
        // Surface the real provider error (e.g. wrong model, invalid key) so the
        // user knows exactly what to fix instead of a generic failure message.
        let detail = '';
        try {
          const data = await res.json();
          const raw = data?.error ?? '';
          try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            detail = parsed?.error?.message || parsed?.message || (typeof raw === 'string' ? raw : '');
          } catch {
            detail = typeof raw === 'string' ? raw : '';
          }
        } catch {}
        toast.error(`${t('ai.test_fail')}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
      }
    } catch (e: any) {
      toast.error(
        e?.name === 'AbortError'
          ? (locale === 'vi'
              ? 'Test quá 30 giây không phản hồi. Vui lòng thử lại hoặc kiểm tra key/credit.'
              : 'Test timed out after 30s. Please retry or check your key/credit.')
          : t('ai.test_fail'),
      );
    } finally {
      setTesting(false);
    }
  };

  if (status === 'loading' || !isAdmin) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            <Settings className="inline h-8 w-8 mr-2 text-primary" />
            {t('ai.title')}
          </h1>
          <p className="text-muted-foreground">{t('ai.subtitle')}</p>
        </div>

        {/* Status */}
        {(savedConfig?.apiKey || savedConfig?.provider === 'router') && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {savedConfig?.provider === 'router'
                ? (locale === 'vi' ? 'Đang bật: AI Router (tự động chọn model rẻ nhất)' : 'Active: AI Router (auto-picks cheapest model)')
                : `${t('ai.active')}: ${savedConfig?.model ?? 'N/A'} (${AI_PROVIDERS.find((p) => p.id === savedConfig?.provider)?.name ?? 'Unknown'})`}
            </span>
          </div>
        )}

        {/* Provider Cards */}
        <h2 className="font-display font-semibold text-lg mb-4">{t('ai.provider')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3 mb-10">
          {AI_PROVIDERS.map((provider, i) => {
            const Icon = provider.icon;
            const isSelected = selectedProvider === provider.id;
            return (
              <motion.button
                key={provider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => provider.active && setSelectedProvider(provider.id)}
                disabled={!provider.active}
                className={`relative p-4 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : provider.active
                    ? 'hover:border-primary/50 hover:shadow-sm cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {!provider.active && (
                  <span className="absolute top-2 right-2 bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                    {t('ai.coming_soon')}
                  </span>
                )}
                <div className={`w-10 h-10 ${provider.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-sm block">{provider.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(provider.description as any)?.[locale] ?? provider.description?.en}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* AI Router config card */}
        {isRouter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto bg-card rounded-xl border p-6 space-y-5"
          >
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              AI Router
            </h3>
            <p className="text-sm text-muted-foreground">
              {locale === 'vi'
                ? 'AI Router tự động phân loại độ khó của mỗi câu hỏi và chọn model rẻ nhất phù hợp để tiết kiệm 60–80% chi phí. Nó dùng các khóa API bạn đã lưu bên dưới — không cần nhập khóa riêng.'
                : 'AI Router automatically classifies each question and routes to the cheapest capable model to cut costs 60–80%. It uses the API keys you already saved below — no separate key needed.'}
            </p>

            <div className="space-y-2">
              <Label>{locale === 'vi' ? 'Nhà cung cấp khả dụng' : 'Available providers'}</Label>
              {ROUTER_SUPPORTED.map((p) => {
                const has = !!savedKeys[p.keyId];
                return (
                  <div key={p.keyId} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      {has ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium">{p.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {has
                        ? (p.tier as any)?.[locale] ?? (p.tier as any)?.en
                        : (locale === 'vi' ? 'Chưa có khóa' : 'No key')}
                    </span>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                {locale === 'vi'
                  ? 'Mẹo: lưu khóa Google/Gemini để có model rẻ nhất cho câu hỏi đơn giản. Càng nhiều nhà cung cấp, Router càng tối ưu được chi phí.'
                  : 'Tip: add a Google/Gemini key for the cheapest simple-question model. The more providers, the better the router optimizes cost.'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1 gap-2">
                <Zap className="h-4 w-4" />
                {locale === 'vi' ? 'Bật AI Router' : 'Enable AI Router'}
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {t('ai.test')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Config Form */}
        {selectedProvider && !isRouter && activeProvider?.active && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto bg-card rounded-xl border p-6 space-y-5"
          >
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              {(() => { const Icon = activeProvider.icon; return <Icon className="h-5 w-5 text-primary" />; })()}
              {activeProvider.name}
            </h3>

            {/* API Key */}
            <div>
              <Label>{t('ai.api_key')} *</Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e: any) => setApiKey(e?.target?.value ?? '')}
                  placeholder={t('ai.api_key_placeholder')}
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                >
                  {showKey ? <><EyeOff className="h-3.5 w-3.5 inline mr-1" />{t('ai.hide_key')}</> : <><Eye className="h-3.5 w-3.5 inline mr-1" />{t('ai.show_key')}</>}
                </button>
              </div>
            </div>

            {/* Model — preset suggestions + free-text custom model + live-fetched list */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>{t('ai.model')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadModels}
                  disabled={loadingModels || !apiKey?.trim()}
                  className="h-7 gap-1.5 text-xs text-primary hover:text-primary"
                >
                  {loadingModels ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Network className="h-3.5 w-3.5" />}
                  {locale === 'vi' ? 'Tải danh sách model' : 'Load model list'}
                </Button>
              </div>
              {fetchedModels.length > 0 ? (
                <select
                  value={model || fetchedModels[0] || ''}
                  onChange={(e: any) => setModel(e?.target?.value ?? '')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {fetchedModels.map((m: string) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <Input
                  list={`models-${activeProvider.id}`}
                  value={model || activeProvider.models?.[0] || ''}
                  onChange={(e: any) => setModel(e?.target?.value ?? '')}
                  placeholder={activeProvider.models?.[0] ?? 'model-name'}
                />
              )}
              <datalist id={`models-${activeProvider.id}`}>
                {(activeProvider.models ?? []).map((m: string) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground mt-1">
                {fetchedModels.length > 0
                  ? (locale === 'vi'
                      ? `Đang hiển thị ${fetchedModels.length} model khả dụng cho khóa của bạn.`
                      : `Showing ${fetchedModels.length} models available to your key.`)
                  : t('ai.model_hint')}
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <Label>{t('ai.system_prompt')}</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e: any) => setSystemPrompt(e?.target?.value ?? '')}
                placeholder={t('ai.default_prompt')}
                rows={3}
              />
            </div>

            {/* How to get API Key */}
            <a
              href={activeProvider.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('ai.how_to')}
            </a>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                {t('ai.save')}
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={testing || !apiKey?.trim()} className="gap-2">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {t('ai.test')}
              </Button>
              <Button variant="destructive" onClick={handleClear} className="gap-2">
                <Trash2 className="h-4 w-4" />
                {t('ai.clear')}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
