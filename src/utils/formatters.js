export const formatCurrency = (amount, symbol = '₹') => {
  const num = Number(amount) || 0;
  return `${symbol}${num.toFixed(2)}`;
};

export const formatTime = (isoString) => {
  if (!isoString) return '';
  if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(isoString)) {
    const timePart = isoString.split(' ')[1];
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr;
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
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

export const getLocalDateString = (dateObj) => {
  if (!dateObj) return getTodayDateString();
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return getTodayDateString();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
