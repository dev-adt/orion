'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { Loader2, Send, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { agentIcon } from '@/lib/ai-agent-shared';
import { type Role } from '@/lib/roles';

type Msg = { role: 'user' | 'assistant'; content: string };

export function AgentsClient({ role }: { role: Role }) {
  const { locale } = useTranslation();
  const vi = locale === 'vi';
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/ai-agents/mine');
        if (res.ok) setAgents((await res.json()).agents ?? []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (active) {
    return <AgentChat agent={active} vi={vi} onBack={() => setActive(null)} />;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          {vi ? 'Công cụ AI' : 'AI Tools'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {vi
            ? 'Các trợ lý AI được phân quyền cho công việc của bạn. Chọn một Agent để bắt đầu.'
            : 'AI assistants assigned to your role. Pick one to start.'}
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl text-muted-foreground">
          {vi
            ? 'Chưa có AI Agent nào dành cho bộ phận của bạn. Vui lòng liên hệ quản trị viên.'
            : 'No AI agents assigned to your role yet.'}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => {
            const Icon = agentIcon(a.icon);
            return (
              <button key={a.id} onClick={() => setActive(a)}
                className="text-left rounded-2xl border bg-card p-5 hover:shadow-md hover:border-primary/40 transition-all flex flex-col gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold text-lg">{vi ? a.name : (a.nameEn ?? a.name)}</p>
                  {a.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{vi ? a.description : (a.descriptionEn ?? a.description)}</p>}
                </div>
                {a.docCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-auto">
                    <BookOpen className="h-3.5 w-3.5" /> {a.docCount} {vi ? 'tài liệu kiến thức' : 'knowledge docs'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AgentChat({ agent, vi, onBack }: { agent: any; vi: boolean; onBack: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const Icon = agentIcon(agent.icon);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setStreaming(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(`/api/ai-agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              acc += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: acc };
                return copy;
              });
            }
          } catch {}
        }
      }
      if (!acc) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: vi ? 'Xin lỗi, chưa có phản hồi. Vui lòng thử lại.' : 'Sorry, no response.' };
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: vi ? 'Đã xảy ra lỗi. Vui lòng thử lại.' : 'An error occurred.' };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-display font-semibold">{vi ? agent.name : (agent.nameEn ?? agent.name)}</p>
          <p className="text-xs text-muted-foreground">{agent.model}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <p className="text-muted-foreground">
              {vi ? 'Bắt đầu trò chuyện với ' : 'Start chatting with '}
              <span className="font-medium text-foreground">{vi ? agent.name : (agent.nameEn ?? agent.name)}</span>
            </p>
            {(agent.suggestedPrompts?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-lg mx-auto">
                {agent.suggestedPrompts.map((s: string, i: number) => (
                  <button key={i} onClick={() => send(s)}
                    className="text-sm px-3 py-1.5 rounded-full border hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              {m.content || (streaming && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : '')}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder={vi ? 'Nhập yêu cầu...' : 'Type a message...'}
            className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm max-h-40 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={() => send()} disabled={streaming || !input.trim()}>
            {streaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
