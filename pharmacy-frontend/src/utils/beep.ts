function createAudioContext(): AudioContext | null {
  try {
    const W = window as unknown as {
      AudioContext: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctx = W.AudioContext || W.webkitAudioContext;
    if (!Ctx) return null;
    return new Ctx();
  } catch {
    return null;
  }
}

async function resumeIfNeeded(ctx: AudioContext) {
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Short tone after a barcode scan or when a line is added to the cart.
 */
export function playScanBeep() {
  void (async () => {
    try {
      const ctx = createAudioContext();
      if (!ctx) return;
      await resumeIfNeeded(ctx);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 920;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.1, t0 + 0.008);
      g.gain.linearRampToValueAtTime(0, t0 + 0.09);
      o.start(t0);
      o.stop(t0 + 0.1);
      setTimeout(() => void ctx.close(), 200);
    } catch {
      /* ignore */
    }
  })();
}

/**
 * Distinct two-tone chime when a sale completes successfully.
 */
export function playSaleCompleteBeep() {
  void (async () => {
    try {
      const ctx = createAudioContext();
      if (!ctx) return;
      await resumeIfNeeded(ctx);

      const scheduleTone = (freq: number, start: number, duration: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ctx.destination);
        const t0 = ctx.currentTime + start;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.09, t0 + 0.012);
        g.gain.linearRampToValueAtTime(0, t0 + duration);
        o.start(t0);
        o.stop(t0 + duration + 0.02);
      };

      scheduleTone(784, 0, 0.11);
      scheduleTone(1047, 0.1, 0.16);
      setTimeout(() => void ctx.close(), 450);
    } catch {
      /* ignore */
    }
  })();
}
