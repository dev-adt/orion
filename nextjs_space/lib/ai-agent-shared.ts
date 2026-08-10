// Shared constants for the AI Agent feature (admin + staff UI).
import {
  Bot, Sparkles, Megaphone, ShoppingCart, Calculator, PenTool,
  Headphones, TrendingUp, FileText, Mail, Briefcase, Lightbulb,
} from 'lucide-react';
import { ROLE_LABELS, type Role } from '@/lib/roles';

export const AGENT_ICONS: Record<string, any> = {
  Bot, Sparkles, Megaphone, ShoppingCart, Calculator, PenTool,
  Headphones, TrendingUp, FileText, Mail, Briefcase, Lightbulb,
};

export function agentIcon(name?: string | null) {
  return AGENT_ICONS[name ?? 'Bot'] ?? Bot;
}

// Models verified against the Abacus RouteLLM endpoint.
export const AGENT_MODELS: { id: string; label: string }[] = [
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (nhanh, tiết kiệm)' },
  { id: 'gpt-4.1', label: 'GPT-4.1 (mạnh nhất)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'route-llm', label: 'Tự động (RouteLLM)' },
];

// Roles an agent can be assigned to (staff roles; admin always sees all).
// 'other' = mục đích khác, không thuộc bộ phận cụ thể — mọi nhân viên đều thấy được.
export const AGENT_ASSIGNABLE_ROLES: string[] = [
  'marketing', 'sales', 'accountant', 'web_designer', 'dev_partner', 'other',
];

// Extra labels for assignable options that are not real user roles.
export const AGENT_ROLE_EXTRA_LABELS: Record<string, { vi: string; en: string }> = {
  other: { vi: 'Khác', en: 'Other' },
};
export function agentRoleLabel(r: string, vi: boolean): string {
  const extra = AGENT_ROLE_EXTRA_LABELS[r];
  if (extra) return vi ? extra.vi : extra.en;
  const rl = ROLE_LABELS[r as Role];
  if (rl) return vi ? rl.vi : rl.en;
  return r;
}
