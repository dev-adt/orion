// Shared Prisma where-clause for posts that should be publicly visible:
// published, publish date reached (or unset), and not expired.
export function visiblePostWhere(extra: Record<string, any> = {}) {
  const now = new Date();
  return {
    published: true,
    AND: [
      { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
      { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    ],
    ...extra,
  };
}
