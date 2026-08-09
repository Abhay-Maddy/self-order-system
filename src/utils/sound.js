// Helper: cancel any pending speech synthesis before speaking
const cancelSpeech = () => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (e) { /* ignore */ }
};

// Helper: build a human-readable items string from order items array
const buildItemsSummary = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) return '';
  const names = items
    .filter(i => i && (i.item_name || i.name))
    .slice(0, 4) // cap at 4 items in announcement
    .map(i => {
      const name = i.item_name || i.name || '';
      const qty = i.quantity || 1;
      return qty > 1 ? `${qty} ${name}` : name;
    });
  if (names.length === 0) return '';
  return `Order includes: ${names.join(', ')}.`;
};

// Web Audio API synthesized Kitchen Order Alert Chime + Table Voice Announcement
// Parameters:
//   tableNumber  — table identifier string (e.g. "T-01" or "1")
//   orderItems   — array of order item objects (optional, for voice summary)
//   suppressVoice — if true, skips the voice announcement (default: false)
export const playKitchenChime = (tableNumber, orderItems, suppressVoice = false) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Two-tone bell chime (High E -> High A)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.2); // A5
      gain2.gain.setValueAtTime(0.5, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);
    }

    // Voice announcement — only if not suppressed and browser supports it
    if (!suppressVoice && 'speechSynthesis' in window) {
      setTimeout(() => {
        cancelSpeech();
        // Build natural announcement text
        const tableText = tableNumber ? `table number ${tableNumber}` : 'an unknown table';
        const itemsText = buildItemsSummary(orderItems);
        const text = itemsText
          ? `New order received for ${tableText}. ${itemsText}`
          : `New order received for ${tableText}.`;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
  } catch (err) {
    console.warn('Audio chime or voice alert failed:', err);
  }
};

// Waiter Alert: Haptic Vibration + Urgency Chime + Voice Announcement when Chef marks dish "Ready to Serve"
// Plays once per call — deduplication must be handled by the caller.
export const playWaiterVibrationAndChime = (tableNumber) => {
  // 1. Mobile / Tablet Haptic Device Vibration
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([400, 150, 400, 150, 600]);
    }
  } catch (e) {
    console.warn('Vibration API not supported:', e);
  }

  // 2. Audio Chime (C5 -> E5 -> G5)
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.5, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.4);
      });
    }

    // 3. Speech Synthesis — clear, single announcement
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        cancelSpeech();
        const tableText = tableNumber ? `table number ${tableNumber}` : 'the active table';
        const text = `Order ready for delivery at ${tableText}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.2;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
  } catch (err) {
    console.warn('Waiter alert chime/speech failed:', err);
  }
};
