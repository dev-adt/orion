'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Settings, Loader2, UserCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProfile {
  customerName: string;
  gender: string; // 'male' | 'female' | 'other'
  phone: string;
  note: string;
}

// Lightweight renderer: turns markdown links [label](url), bare URLs and **bold** into React nodes
function renderRich(text: string) {
  const nodes: any[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    if (m[1] && m[2]) {
      nodes.push(
        <a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">{m[1]}</a>
      );
    } else if (m[3]) {
      nodes.push(<strong key={key++}>{m[3]}</strong>);
    } else if (m[4]) {
      nodes.push(
        <a key={key++} href={m[4]} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{m[4]}</a>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function genderLabel(g?: string) {
  return g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác';
}

export function AIChatbot() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-chat profile collected from the visitor before the conversation starts.
  const [profile, setProfile] = useState<ChatProfile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState('male');
  const [formPhone, setFormPhone] = useState('');
  const [formNote, setFormNote] = useState('');
  const [starting, setStarting] = useState(false);

  // Restore saved profile/session (so returning visitors skip the form).
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('chat_profile') || 'null');
      const sid = localStorage.getItem('chat_session_id');
      if (p && sid) {
        setProfile(p);
        setSessionId(sid);
      }
    } catch {}
  }, []);

  // Load AI config: server-trained brain (provider/model/prompt) + per-provider API key from localStorage
  useEffect(() => {
    let active = true;
    (async () => {
      let legacy: any = null;
      try { legacy = JSON.parse(localStorage.getItem('ai_settings') || 'null'); } catch {}
      let keys: any = {};
      try { keys = JSON.parse(localStorage.getItem('ai_keys') || '{}'); } catch {}

      let server: any = null;
      try {
        const res = await fetch('/api/ai/assistant');
        if (res?.ok) { const j = await res.json(); server = j?.config ?? null; }
      } catch {}

      const provider = server?.provider ?? legacy?.provider ?? 'openai';
      const systemPrompt = server?.systemPrompt ?? legacy?.systemPrompt ?? '';

      if (provider === 'router') {
        const present: Record<string, string> = {};
        for (const [k, v] of Object.entries(keys || {})) {
          if (v) present[k] = v as string;
        }
        const hasAnyKey = Object.keys(present).length > 0;
        let routerKeys = '';
        try {
          routerKeys = hasAnyKey
            ? btoa(unescape(encodeURIComponent(JSON.stringify(present))))
            : '';
        } catch { routerKeys = ''; }
        if (active) {
          setAiConfig({
            provider: 'router',
            model: 'Auto (Router)',
            apiKey: hasAnyKey ? 'router' : '',
            routerKeys,
            systemPrompt,
          });
        }
        return;
      }

      const model = server?.model ?? legacy?.model ?? 'gpt-4o-mini';
      const apiKey = keys?.[provider] || (legacy?.provider === provider ? legacy?.apiKey : '') || '';

      if (active) setAiConfig({ provider, model, apiKey, systemPrompt });
    })();
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && profile && inputRef?.current) {
      inputRef.current.focus();
    }
  }, [open, profile]);

  const hasKey = aiConfig?.apiKey && aiConfig?.model;

  // Persist a message to the chat session (fire-and-forget) for customer care.
  const persist = (role: 'user' | 'assistant', content: string, sid?: string | null) => {
    const id = sid ?? sessionId;
    if (!id || !content?.trim()) return;
    fetch(`/api/chat-sessions/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content }),
    }).catch(() => {});
  };

  const phoneValid = (v: string) => /^[0-9+()\-.\s]{8,15}$/.test(v.trim());

  const startChat = async () => {
    if (!formName.trim() || starting) return;
    if (!phoneValid(formPhone)) return;
    setStarting(true);
    const prof: ChatProfile = { customerName: formName.trim(), gender: formGender, phone: formPhone.trim(), note: formNote.trim() };
    try {
      const res = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prof),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.id) {
        localStorage.setItem('chat_profile', JSON.stringify(prof));
        localStorage.setItem('chat_session_id', j.id);
        setProfile(prof);
        setSessionId(j.id);
        const addr = prof.gender === 'male' ? 'anh' : prof.gender === 'female' ? 'chị' : 'bạn';
        const greet = `Xin chào ${addr} ${prof.customerName}! Rất vui được hỗ trợ ${addr}. ${addr.charAt(0).toUpperCase() + addr.slice(1)} đang cần tìm sản phẩm hay thông tin gì ạ?`;
        setMessages([{ role: 'assistant', content: greet }]);
        persist('assistant', greet, j.id);
      }
    } catch {} finally {
      setStarting(false);
    }
  };

  const resetProfile = () => {
    try {
      localStorage.removeItem('chat_profile');
      localStorage.removeItem('chat_session_id');
    } catch {}
    setProfile(null);
    setSessionId(null);
    setMessages([]);
    setFormName('');
    setFormGender('male');
    setFormPhone('');
    setFormNote('');
  };

  const sendMessage = async () => {
    if (!input?.trim() || loading || !hasKey || !profile) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...(prev ?? []), userMsg]);
    setInput('');
    setLoading(true);
    persist('user', userMsg.content);

    // Personalize the system prompt with the visitor's profile.
    const addr = profile.gender === 'male' ? 'anh' : profile.gender === 'female' ? 'chị' : 'bạn';
    const profileContext =
      `\n\nTHÔNG TIN KHÁCH HÀNG:\n- Tên: ${profile.customerName}\n- Giới tính: ${genderLabel(profile.gender)}` +
      (profile.phone ? `\n- Số điện thoại: ${profile.phone}` : '') +
      (profile.note ? `\n- Ghi chú: ${profile.note}` : '') +
      `\nHãy xưng hô lịch sự (gọi khách là "${addr}") và cá nhân hóa câu trả lời.`;
    const sysPrompt = (aiConfig?.systemPrompt ?? t('ai.default_prompt')) + profileContext;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': aiConfig?.provider ?? 'openai',
          ...(aiConfig?.provider === 'router'
            ? { 'x-ai-keys': aiConfig?.routerKeys ?? '' }
            : {
                'x-ai-key': aiConfig?.apiKey ?? '',
                'x-ai-model': aiConfig?.model ?? 'gpt-4o-mini',
              }),
        },
        body: JSON.stringify({
          messages: [...(messages ?? []), userMsg],
          systemPrompt: sysPrompt,
        }),
      });

      if (!res?.ok) {
        throw new Error('API error');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages((prev) => [...(prev ?? []), { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line?.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  assistantContent += delta;
                  setMessages((prev) => {
                    const updated = [...(prev ?? [])];
                    if (updated.length > 0) {
                      updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                    }
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      }
      persist('assistant', assistantContent);
    } catch (err: any) {
      setMessages((prev) => [
        ...(prev ?? []),
        { role: 'assistant', content: t('ai.test_fail') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        aria-label="AI Chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Popup */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[72vh] bg-background border rounded-xl shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">{t('chat.title')}</span>
            </div>
            <div className="flex items-center gap-2">
              {hasKey && profile && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {aiConfig?.model}
                </span>
              )}
              {profile && (
                <button
                  onClick={resetProfile}
                  className="text-xs bg-white/20 px-2 py-0.5 rounded-full hover:bg-white/30"
                  title="Bắt đầu phiên mới"
                >
                  Mới
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {!hasKey ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <Settings className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t('chat.no_key')}{' '}
                  <Link href="/ai-settings" className="text-primary font-semibold hover:underline" onClick={() => setOpen(false)}>
                    {t('chat.settings_link')}
                  </Link>
                </p>
              </div>
            ) : !profile ? (
              /* Pre-chat profile form */
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle2 className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Chào mừng bạn! Để được hỗ trợ tốt nhất, vui lòng cho chúng tôi biết đôi chút về bạn.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Họ tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e: any) => setFormName(e?.target?.value ?? '')}
                    placeholder="Nhập tên của bạn"
                    className="mt-1 w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Giới tính</label>
                  <div className="mt-1 flex gap-2">
                    {[{ v: 'male', l: 'Nam' }, { v: 'female', l: 'Nữ' }, { v: 'other', l: 'Khác' }].map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setFormGender(o.v)}
                        className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                          formGender === o.v
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e: any) => setFormPhone(e?.target?.value ?? '')}
                    placeholder="VD: 0901 234 567"
                    className="mt-1 w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                  />
                  {formPhone.trim() !== '' && !phoneValid(formPhone) && (
                    <p className="mt-1 text-xs text-red-500">Số điện thoại không hợp lệ (8-15 chữ số)</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Bạn cần hỗ trợ gì? (tùy chọn)</label>
                  <textarea
                    value={formNote}
                    onChange={(e: any) => setFormNote(e?.target?.value ?? '')}
                    placeholder="VD: Tôi muốn tư vấn điện thoại tầm 10 triệu..."
                    rows={2}
                    className="mt-1 w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-none"
                  />
                </div>
                <Button onClick={startChat} disabled={!formName.trim() || !phoneValid(formPhone) || starting} className="w-full">
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bắt đầu trò chuyện'}
                </Button>
              </div>
            ) : (
              <>
                {(messages?.length ?? 0) === 0 && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm max-w-[80%]">
                      {t('chat.welcome')}
                    </div>
                  </div>
                )}
                {(messages ?? []).map((msg: Message, i: number) => (
                  <div key={i} className={`flex gap-2 ${msg?.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg?.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                    }`}>
                      {msg?.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                    </div>
                    <div className={`rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap ${
                      msg?.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-muted rounded-tl-none'
                    }`}>
                      {msg?.role === 'assistant'
                        ? (msg?.content ? renderRich(msg.content) : (loading && i === (messages?.length ?? 0) - 1 ? t('chat.thinking') : ''))
                        : msg?.content}
                    </div>
                  </div>
                ))}
                {loading && (messages?.length ?? 0) > 0 && !(messages?.[(messages?.length ?? 0) - 1]?.content) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('chat.thinking')}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          {hasKey && profile && (
            <div className="border-t p-3 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e: any) => setInput(e?.target?.value ?? '')}
                onKeyDown={(e: any) => e?.key === 'Enter' && sendMessage()}
                placeholder={t('chat.placeholder')}
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                disabled={loading}
              />
              <Button size="icon" onClick={sendMessage} disabled={loading || !input?.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
