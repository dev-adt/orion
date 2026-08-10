'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import {
  Plus, Pencil, Trash2, Loader2, Save, X, Upload, FileText,
  Power, PowerOff, Sparkles, /* Copy, ExternalLink imported below */
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Copy, ExternalLink } from 'lucide-react';
import { AGENT_ICONS, agentIcon, AGENT_MODELS, AGENT_ASSIGNABLE_ROLES, agentRoleLabel } from '@/lib/ai-agent-shared';

function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

const ICON_KEYS = Object.keys(AGENT_ICONS);

export function AiAgentManager() {
  const { locale } = useTranslation();
  const vi = locale === 'vi';
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-agents');
      if (res.ok) {
        const { agents } = await res.json();
        setAgents(agents ?? []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (a: any) => {
    try {
      await fetch(`/api/admin/ai-agents/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !a.active }),
      });
      setAgents((prev) => prev.map((x) => (x.id === a.id ? { ...x, active: !a.active } : x)));
    } catch {
      toast.error(vi ? 'Thất bại' : 'Failed');
    }
  };

  const remove = async (a: any) => {
    if (!confirm(vi ? `Xóa AI Agent “${a.name}”?` : `Delete AI Agent “${a.name}”?`)) return;
    try {
      await fetch(`/api/admin/ai-agents/${a.id}`, { method: 'DELETE' });
      setAgents((prev) => prev.filter((x) => x.id !== a.id));
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {vi ? 'AI Agent — công cụ làm việc' : 'AI Agents'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {vi
              ? 'Tạo các trợ lý AI, chọn model, viết chỉ dẫn, nạp tài liệu và phân quyền cho từng bộ phận.'
              : 'Create AI assistants, pick a model, write instructions, upload knowledge, and assign to roles.'}
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { setEditing(null); setEditorOpen(true); }}>
          <Plus className="h-4 w-4" /> {vi ? 'Tạo Agent' : 'New Agent'}
        </Button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl text-muted-foreground">
          {vi ? 'Chưa có AI Agent nào. Bấm “Tạo Agent” để bắt đầu.' : 'No agents yet.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => {
            const Icon = agentIcon(a.icon);
            const roles = (a.roles ?? '').split(',').map((r: string) => r.trim()).filter(Boolean);
            return (
              <div key={a.id} className={`rounded-xl border p-4 flex flex-col gap-3 ${a.active ? 'bg-card' : 'bg-muted/40'}`}>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.model}</p>
                  </div>
                </div>
                {a.description && <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {roles.length === 0 ? (
                    <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {vi ? 'Chưa phân quyền' : 'No roles'}
                    </span>
                  ) : roles.map((r: string) => (
                    <span key={r} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {agentRoleLabel(r, vi)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{(a._count?.docs ?? 0)} {vi ? 'tài liệu' : 'docs'}</span>
                  <button onClick={() => toggleActive(a)} className="inline-flex items-center gap-1 hover:text-foreground">
                    {a.active
                      ? <><Power className="h-3.5 w-3.5 text-green-600" /> {vi ? 'Đang bật' : 'Active'}</>
                      : <><PowerOff className="h-3.5 w-3.5" /> {vi ? 'Đã tắt' : 'Off'}</>}
                  </button>
                </div>
                <div className="flex gap-2 pt-1 border-t">
                  <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={() => { setEditing(a); setEditorOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" /> {vi ? 'Sửa' : 'Edit'}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={() => remove(a)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editorOpen && (
        <AgentEditor
          agent={editing}
          vi={vi}
          onClose={() => setEditorOpen(false)}
          onSaved={() => { setEditorOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function AgentEditor({ agent, vi, onClose, onSaved }: { agent: any | null; vi: boolean; onClose: () => void; onSaved: () => void }) {
  const isNew = !agent?.id;
  const [name, setName] = useState(agent?.name ?? '');
  const [nameEn, setNameEn] = useState(agent?.nameEn ?? '');
  const [description, setDescription] = useState(agent?.description ?? '');
  const [icon, setIcon] = useState(agent?.icon ?? 'Bot');
  const [model, setModel] = useState(agent?.model ?? 'gpt-4.1-mini');
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? '');
  const [roles, setRoles] = useState<string[]>(
    (agent?.roles ?? '').split(',').map((r: string) => r.trim()).filter(Boolean),
  );
  const [temperature, setTemperature] = useState<number>(typeof agent?.temperature === 'number' ? agent.temperature : 0.3);
  const [maxTokens, setMaxTokens] = useState<number>(typeof agent?.maxTokens === 'number' ? agent.maxTokens : 1200);
  const [suggestedPrompts, setSuggestedPrompts] = useState(agent?.suggestedPrompts ?? '');
  const [useWebsiteData, setUseWebsiteData] = useState(agent?.useWebsiteData === true);
  const [embeddable, setEmbeddable] = useState(agent?.embeddable === true);
  const [active, setActive] = useState(agent?.active !== false);
  const [saving, setSaving] = useState(false);

  const [docs, setDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(!isNew);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setDocsLoading(true);
      try {
        const res = await fetch(`/api/admin/ai-agents/${agent.id}/docs`);
        if (res.ok) setDocs((await res.json()).docs ?? []);
      } catch {}
      setDocsLoading(false);
    })();
  }, [agent?.id, isNew]);

  const toggleRole = (r: string) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const save = async () => {
    if (!name.trim()) { toast.error(vi ? 'Nhập tên Agent' : 'Enter a name'); return; }
    setSaving(true);
    try {
      const payload = { name, nameEn, description, icon, model, systemPrompt, roles, temperature, maxTokens, suggestedPrompts, useWebsiteData, embeddable, active };
      const res = await fetch(isNew ? '/api/admin/ai-agents' : `/api/admin/ai-agents/${agent.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(vi ? 'Đã lưu Agent' : 'Agent saved');
      onSaved();
    } catch {
      toast.error(vi ? 'Lưu thất bại' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || isNew) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        if (!text.trim()) continue;
        const res = await fetch(`/api/admin/ai-agents/${agent.id}/docs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: file.name.replace(/\.[^.]+$/, ''), fileName: file.name, content: text }),
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
    if (ok > 0) toast.success(vi ? `Đã thêm ${ok} tài liệu` : `Added ${ok} doc(s)`);
    else toast.error(vi ? 'Không đọc được tệp' : 'Could not read file(s)');
  };

  const deleteDoc = async (id: string) => {
    try {
      await fetch(`/api/admin/ai-agents/${agent.id}/docs/${id}`, { method: 'DELETE' });
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background rounded-t-xl">
          <h3 className="font-display font-semibold text-lg">
            {isNew ? (vi ? 'Tạo AI Agent' : 'New AI Agent') : (vi ? 'Sửa AI Agent' : 'Edit AI Agent')}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>{vi ? 'Tên Agent' : 'Name'} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={vi ? 'VD: Trợ lý Marketing' : 'e.g. Marketing Assistant'} />
            </div>
            <div>
              <Label>{vi ? 'Tên (English)' : 'Name (EN)'}</Label>
              <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>{vi ? 'Mô tả ngắn' : 'Description'}</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={vi ? 'Công cụ này giúp gì?' : 'What does it help with?'} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>{vi ? 'Model AI' : 'AI Model'}</Label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                {AGENT_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <Label>{vi ? 'Biểu tượng' : 'Icon'}</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {ICON_KEYS.map((k) => {
                  const I = AGENT_ICONS[k];
                  return (
                    <button key={k} type="button" onClick={() => setIcon(k)}
                      className={`h-9 w-9 rounded-md border flex items-center justify-center ${icon === k ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                      <I className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <Label>{vi ? 'Phân quyền (bộ phận được dùng)' : 'Assigned roles'}</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {AGENT_ASSIGNABLE_ROLES.map((r) => (
                <button key={r} type="button" onClick={() => toggleRole(r)}
                  className={`text-sm px-3 py-1.5 rounded-full border ${roles.includes(r) ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                  {agentRoleLabel(r, vi)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {vi ? 'Nhân viên thuộc bộ phận được chọn sẽ thấy và dùng được Agent này. Chọn “Khác” để mọi nhân viên đều dùng được. Admin luôn thấy tất cả.' : 'Selected roles can use this agent. Pick “Other” to let all staff use it. Admin always sees all.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label>{vi ? 'Độ sáng tạo (Temperature)' : 'Creativity (Temperature)'}</Label>
                <span className="text-sm font-medium tabular-nums">{temperature.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-2 accent-primary cursor-pointer" />
              <p className="text-xs text-muted-foreground mt-1">
                {vi ? 'Nên đặt 0,2–0,4 để câu trả lời ổn định, ít bịa và bám sát tài liệu. Cao hơn = sáng tạo hơn nhưng dễ sai.' : 'Use 0.2–0.4 for stable, grounded answers. Higher = more creative but less reliable.'}
              </p>
            </div>
            <div>
              <Label>{vi ? 'Giới hạn độ dài trả lời (tokens)' : 'Max response length (tokens)'}</Label>
              <Input type="number" min={100} max={8000} step={100} value={maxTokens}
                onChange={(e) => setMaxTokens(Math.max(100, Math.min(8000, parseInt(e.target.value) || 1200)))} />
              <p className="text-xs text-muted-foreground mt-1">
                {vi ? 'Khoảng 800–1.500 tokens là phù hợp cho câu trả lời thông thường.' : 'Around 800–1,500 tokens suits typical answers.'}
              </p>
            </div>
          </div>

          <div>
            <Label>{vi ? 'Chỉ dẫn (System Prompt)' : 'System Prompt'}</Label>
            <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={5}
              placeholder={vi ? 'VD: Bạn là chuyên gia marketing. Viết nội dung quảng cáo ngắn gọn, hấp dẫn...' : 'e.g. You are a marketing expert...'} />
          </div>

          <div>
            <Label>{vi ? 'Câu gợi ý mẫu (mỗi dòng 1 câu)' : 'Suggested prompts (one per line)'}</Label>
            <Textarea value={suggestedPrompts} onChange={(e) => setSuggestedPrompts(e.target.value)} rows={3}
              placeholder={vi ? 'Viết caption cho sản phẩm mới\nSoạn email khuyến mãi' : 'Write a caption...'} />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={useWebsiteData} onChange={(e) => setUseWebsiteData(e.target.checked)} className="h-4 w-4" />
              {vi ? 'Dùng dữ liệu sản phẩm của web' : 'Use website product data'}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={embeddable} onChange={(e) => setEmbeddable(e.target.checked)} className="h-4 w-4" />
              {vi ? 'Cho phép nhúng công khai (Embed)' : 'Allow public embed'}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
              {vi ? 'Đang hoạt động' : 'Active'}
            </label>
          </div>

          {/* Embed code section — always show for saved agents */}
          {!isNew && (
            <EmbedCodeSection agentId={agent.id} vi={vi} embeddable={embeddable} />
          )}

          {/* Knowledge documents */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="mb-0">{vi ? 'Tài liệu kiến thức (.md, .txt)' : 'Knowledge documents'}</Label>
              {!isNew && (
                <>
                  <input ref={fileRef} type="file" accept=".md,.txt,.markdown,text/plain,text/markdown" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={uploading} onClick={() => fileRef.current?.click()}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {vi ? 'Nạp tài liệu' : 'Upload'}
                  </Button>
                </>
              )}
            </div>
            {isNew ? (
              <p className="text-xs text-muted-foreground">{vi ? 'Lưu Agent trước, sau đó bạn có thể nạp tài liệu kiến thức.' : 'Save first, then upload knowledge.'}</p>
            ) : docsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : docs.length === 0 ? (
              <p className="text-xs text-muted-foreground">{vi ? 'Chưa có tài liệu. Nạp file .md hoặc .txt để Agent trả lời sát dữ liệu công ty.' : 'No docs yet.'}</p>
            ) : (
              <ul className="space-y-1.5">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{d.fileName ?? d.title}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(d.size ?? 0)}</span>
                    <button onClick={() => deleteDoc(d.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t sticky bottom-0 bg-background rounded-b-xl">
          <Button variant="outline" onClick={onClose}>{vi ? 'Hủy' : 'Cancel'}</Button>
          <Button className="gap-2" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {vi ? 'Lưu' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Embed code generator ----------
function EmbedCodeSection({ agentId, vi, embeddable }: { agentId: string; vi: boolean; embeddable: boolean }) {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXTAUTH_URL || 'https://orion.abacusai.app');
  const embedUrl = `${baseUrl}/embed/agent/${agentId}`;
  const iframeCode = `<iframe src="${embedUrl}" width="400" height="600" style="border:0;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);max-width:100%" title="AI Agent"></iframe>`;

  const copyCode = () => {
    navigator.clipboard.writeText(iframeCode).then(
      () => toast.success(vi ? 'Đã sao chép mã nhúng' : 'Embed code copied'),
      () => toast.error(vi ? 'Không sao chép được' : 'Copy failed'),
    );
  };

  return (
    <div className="border-t pt-4 space-y-2">
      <Label className="flex items-center gap-1.5">
        {vi ? 'Mã nhúng (Embed code)' : 'Embed code'}
      </Label>
      {!embeddable && (
        <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-2">
          {vi
            ? 'Lưu ý: Hãy tích chọn "Cho phép nhúng công khai (Embed)" ở trên rồi bấm Lưu, thì mã nhúng bên dưới mới hoạt động trên website khác.'
            : 'Note: Enable "Allow public embed" above and click Save for this embed code to work on other sites.'}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {vi
          ? 'Dán đoạn mã này vào trang bất kỳ (HTML) để hiển thị khung chat của Agent.'
          : 'Paste this code into any page (HTML) to show the Agent chat widget.'}
      </p>
      <div className="bg-muted rounded-lg p-3">
        <code className="text-xs break-all whitespace-pre-wrap select-all">{iframeCode}</code>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={copyCode}>
          <Copy className="h-3.5 w-3.5" /> {vi ? 'Sao chép mã' : 'Copy code'}
        </Button>
        <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ExternalLink className="h-3.5 w-3.5" /> {vi ? 'Xem thử' : 'Preview'}
        </a>
      </div>
    </div>
  );
}