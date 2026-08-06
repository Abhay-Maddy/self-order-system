export const formatCurrency = (amount, symbol = '₹') => {
  const num = Number(amount) || 0;
  return `${symbol}${num.toFixed(2)}`;
};

export const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDuration = (startTime) => {
  if (!startTime) return '0m';
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diffMinutes = Math.floor((now - start) / (1000 * 60));
  return `${diffMinutes}m`;
};

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
