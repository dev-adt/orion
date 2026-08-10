/**
 * AI Router - Complexity classifier.
 * Rule-based (fast, free) classification of a question into
 * SIMPLE / MEDIUM / COMPLEX, tuned for a Vietnamese e-commerce + ERP context.
 */

import type { Complexity } from './model-config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClassifierConfig {
  simpleMaxWords: number;
  mediumMaxWords: number;
  longHistoryTurns: number;
  mediumScoreThreshold: number;
  complexScoreThreshold: number;
  mediumKeywords: string[];
  complexKeywords: string[];
}

export const DEFAULT_CLASSIFIER_CONFIG: ClassifierConfig = {
  simpleMaxWords: 15,
  mediumMaxWords: 45,
  longHistoryTurns: 6,
  mediumScoreThreshold: 2,
  complexScoreThreshold: 4,
  mediumKeywords: [
    'phân tích', 'tóm tắt', 'tổng hợp', 'đơn hàng', 'hoá đơn', 'hóa đơn',
    'tồn kho', 'báo cáo', 'thống kê', 'doanh thu', 'khách hàng', 'erp',
    'truy vấn', 'lọc', 'sắp xếp', 'tính toán', 'so với', 'gợi ý',
    'analyze', 'summary', 'summarize', 'report', 'invoice', 'order',
    'inventory', 'query', 'calculate', 'recommend',
  ],
  complexKeywords: [
    'code', 'lập trình', 'thuật toán', 'gỡ lỗi', 'debug', 'so sánh',
    'đánh giá', 'chiến lược', 'tối ưu', 'kiến trúc', 'thiết kế hệ thống',
    'chứng minh', 'suy luận', 'vì sao', 'tại sao', 'giải thích chi tiết',
    'nhiều bước', 'phức tạp',
    'algorithm', 'refactor', 'architecture', 'optimize', 'compare',
    'reasoning', 'step by step', 'prove', 'explain in detail',
  ],
};

export interface ClassificationResult {
  complexity: Complexity;
  score: number;
  reasons: string[];
}

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function containsAny(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase()));
}

function hasCodeBlock(text: string): boolean {
  return /```|function\s+\w+|=>|;\s*$|SELECT\s+.+FROM/i.test(text);
}

export function classify(
  question: string,
  history: ChatMessage[] = [],
  config: Partial<ClassifierConfig> = {},
): ClassificationResult {
  const cfg = { ...DEFAULT_CLASSIFIER_CONFIG, ...config };
  const reasons: string[] = [];
  let score = 0;

  const words = countWords(question);
  if (words > cfg.mediumMaxWords) {
    score += 2;
    reasons.push(`Câu hỏi dài (${words} từ)`);
  } else if (words > cfg.simpleMaxWords) {
    score += 1;
    reasons.push(`Câu hỏi trung bình (${words} từ)`);
  } else {
    reasons.push(`Câu hỏi ngắn (${words} từ)`);
  }

  const mediumHits = containsAny(question, cfg.mediumKeywords);
  if (mediumHits.length > 0) {
    score += Math.min(mediumHits.length, 2);
    reasons.push(`Từ khoá MEDIUM: ${mediumHits.slice(0, 5).join(', ')}`);
  }

  const complexHits = containsAny(question, cfg.complexKeywords);
  if (complexHits.length > 0) {
    score += 2 * Math.min(complexHits.length, 2);
    reasons.push(`Từ khoá COMPLEX: ${complexHits.slice(0, 5).join(', ')}`);
  }

  if (hasCodeBlock(question)) {
    score += 2;
    reasons.push('Phát hiện code / SQL');
  }

  const subQuestions = (question.match(/[?？]/g) || []).length;
  if (subQuestions >= 2) {
    score += 1;
    reasons.push(`Nhiều câu hỏi con (${subQuestions})`);
  }

  if (history.length >= cfg.longHistoryTurns) {
    score += 1;
    reasons.push(`Hội thoại dài (${history.length} lượt)`);
  }

  let complexity: Complexity;
  if (score >= cfg.complexScoreThreshold) complexity = 'COMPLEX';
  else if (score >= cfg.mediumScoreThreshold) complexity = 'MEDIUM';
  else complexity = 'SIMPLE';

  return { complexity, score, reasons };
}
