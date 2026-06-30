/**
 * Notification helper for EduConnect
 * Handles browser notification permissions, native device push notifications, and custom synthesized notification chime sounds.
 */

// Synthesize a gentle mobile-like notification chime using Web Audio API
export function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Prevent issues where browsers block audio until user interaction
    if (ctx.state === 'suspended') {
      // We will attempt to resume, but don't block
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Helper to play a single clean tone
    const playTone = (freq: number, startTime: number, duration: number, volume = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth volume envelope to prevent click sounds
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // A beautiful 3-tone arpeggio chord chime (C5 -> E5 -> G5) mimicking premium device alerts
    playTone(523.25, now, 0.45, 0.12);        // C5
    playTone(659.25, now + 0.10, 0.45, 0.12); // E5
    playTone(783.99, now + 0.20, 0.60, 0.12); // G5
  } catch (error) {
    console.log('[Audio] Notification audio context could not be initialized:', error);
  }
}

// Request permission for showing native device notifications
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Play a quick test sound to confirm to the user
      playNotificationChime();
    }
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'default';
  }
}

// Send native notification using HTML5 Web Notification API
export function sendNativeNotification(title: string, body: string, tag?: string) {
  // Always play the synthesized chime sound
  playNotificationChime();

  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const options: any = {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Fallback standard school/user icon
        tag: tag || 'educonnect-notif',
        renotify: true,
        requireInteraction: false
      };
      
      const notif = new Notification(title, options);
      
      // Auto close notification after 5 seconds to prevent cluttering the device screen
      setTimeout(() => notif.close(), 5000);
      
      // Clicking the notification focuses the window
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Native Notification construction failed. Some mobile devices require a Service Worker to show notifications.', e);
    }
  }
}
