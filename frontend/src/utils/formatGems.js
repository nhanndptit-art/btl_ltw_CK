export const formatGems = (gems) => {
  const amount = Number(gems);

  if (!Number.isFinite(amount)) return '—';
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;

  return amount.toLocaleString();
};
