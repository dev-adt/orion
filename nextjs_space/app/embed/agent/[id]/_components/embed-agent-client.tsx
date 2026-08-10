'use client';

import { useState, useRef, useEffect } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

interface Props {
  agent: {
    id: string;
    name: string;
    nameEn?: string | null;
    description?: string | null;
    icon: string;
    suggestedPrompts: string[];
  };
}

export function EmbedAgentClient({ agent }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch(`/api/embed/agent/${agent.id}/chat`, {
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
          copy[copy.length - 1] = { role: 'assistant', content: 'Xin lỗi, chưa có phản hồi. Vui lòng thử lại.' };
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: 'Đã xảy ra lỗi. Vui lòng thử lại.' };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          🤖
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{agent.name}</div>
          {agent.description && <div style={{ fontSize: 12, color: '#71717a' }}>{agent.description}</div>}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🤖</div>
            <p style={{ color: '#71717a', fontSize: 14 }}>Xin chào! Tôi là <strong>{agent.name}</strong>. Hãy đặt câu hỏi để bắt đầu.</p>
            {agent.suggestedPrompts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 16 }}>
                {agent.suggestedPrompts.map((s, i) => (
                  <button key={i} onClick={() => send(s)}
                    style={{
                      fontSize: 13, padding: '6px 12px', borderRadius: 20, border: '1px solid #e4e4e7',
                      background: '#fff', cursor: 'pointer', color: '#18181b',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', borderRadius: 16, padding: '8px 14px', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5,
              background: m.role === 'user' ? '#ea580c' : '#f4f4f5',
              color: m.role === 'user' ? '#fff' : '#18181b',
            }}>
              {m.content || (streaming && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid #e4e4e7', padding: '10px 16px', display: 'flex', gap: 8, background: '#fafafa' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          placeholder="Nhập câu hỏi..."
          style={{
            flex: 1, resize: 'none', borderRadius: 12, border: '1px solid #e4e4e7', padding: '10px 14px',
            fontSize: 14, outline: 'none', maxHeight: 120, fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => send()}
          disabled={streaming || !input.trim()}
          style={{
            width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: streaming || !input.trim() ? '#d4d4d8' : '#ea580c', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
          }}
        >
          {streaming ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}
