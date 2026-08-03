// Web Audio API synthesized Kitchen Order Alert Chime + Table Voice Announcement
export const playKitchenChime = (tableNumber) => {
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

    // Voice announcement for table number
    if ('speechSynthesis' in window && tableNumber) {
      setTimeout(() => {
        const text = `New order received for Table ${tableNumber}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }, 400);
    }
  } catch (err) {
    console.warn('Audio chime or voice alert failed:', err);
  }
};
