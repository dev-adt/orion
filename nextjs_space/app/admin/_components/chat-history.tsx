'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, User, Bot, RefreshCw, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SessionRow {
  id: string;
  customerName: string;
  gender?: string | null;
  note?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatMsg {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

function genderLabel(g?: string | null) {
  return g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : g ? 'Khác' : '—';
}

function fmt(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  } catch {
    return '';
  }
}

export function ChatHistory() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ info: SessionRow | null; messages: ChatMsg[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/chat-sessions');
      const j = await res.json();
      if (res.ok) setSessions(j?.sessions ?? []);
    } catch {
      toast.error('Không tải được danh sách chat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const openSession = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch('/api/admin/chat-sessions/' + id);
      const j = await res.json();
      if (res.ok) {
        setDetail({ info: j?.session ?? null, messages: j?.session?.messages ?? [] });
      }
    } catch {
      toast.error('Không tải được nội dung');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch('/api/admin/chat-sessions/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: next } : s)));
        setDetail((prev) => (prev?.info ? { ...prev, info: { ...prev.info, status: next } } : prev));
        toast.success(next === 'closed' ? 'Đã đóng phiên' : 'Đã mở lại phiên');
      }
    } catch {
      toast.error('Không cập nhật được');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Lịch sử chat khách hàng
          </h2>
          <p className="text-sm text-muted-foreground">Theo dõi hội thoại để chăm sóc khách hàng</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSessions} disabled={loading}>
          <RefreshCw className={'h-4 w-4 mr-1 ' + (loading ? 'animate-spin' : '')} /> Làm mới
        </Button>
      </div>

      <div className="grid md:grid-cols-[340px_1fr] gap-4">
        <div className="border rounded-lg overflow-hidden max-h-[560px] overflow-y-auto">
          {loading ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa có phiên chat nào</div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s.id)}
                className={'w-full text-left px-3 py-3 border-b hover:bg-muted transition-colors ' + (selectedId === s.id ? 'bg-muted' : '')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{s.customerName}</span>
                  <span className={'text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ' + (s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                    {s.status === 'open' ? <Circle className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
                    {s.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>{genderLabel(s.gender)}</span>
                  <span>•</span>
                  <span>{s.messageCount} tin nhắn</span>
                </div>
                {s.phone && <div className="text-[11px] text-muted-foreground mt-0.5">📞 {s.phone}</div>}
                <div className="text-[11px] text-muted-foreground mt-0.5">{fmt(s.updatedAt)}</div>
              </button>
            ))
          )}
        </div>

        <div className="border rounded-lg p-4 min-h-[300px] max-h-[560px] overflow-y-auto">
          {!selectedId ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Chọn một phiên chat để xem chi tiết
            </div>
          ) : detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : detail?.info ? (
            <div>
              <div className="pb-3 mb-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{detail.info.customerName}</h3>
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(detail.info!.id, detail.info!.status)}>
                    {detail.info.status === 'open' ? 'Đóng phiên' : 'Mở lại'}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <div>Giới tính: {genderLabel(detail.info.gender)}</div>
                  {detail.info.phone && <div>SĐT: {detail.info.phone}</div>}
                  {detail.info.email && <div>Email: {detail.info.email}</div>}
                  {detail.info.note && <div>Ghi chú: {detail.info.note}</div>}
                  <div>Bắt đầu: {fmt(detail.info.createdAt)}</div>
                </div>
              </div>
              <div className="space-y-3">
                {detail.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Chưa có tin nhắn</p>
                ) : (
                  detail.messages.map((m) => (
                    <div key={m.id} className={'flex gap-2 ' + (m.role === 'user' ? 'flex-row-reverse' : '')}>
                      <div className={'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ' + (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/10')}>
                        {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                      </div>
                      <div className={'rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap ' + (m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none')}>
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Không tìm thấy phiên</div>
          )}
        </div>
      </div>
    </div>
  );
}
