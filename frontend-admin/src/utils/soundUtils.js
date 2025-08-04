// Sound utility for admin notifications
class SoundUtils {
  constructor() {
    this.audioContext = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      // Create audio context for generating sounds
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  // Play a notification beep sound
  playNotificationBeep() {
    if (!this.audioContext) return;

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create oscillator for beep sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure sound - pleasant notification beep
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800Hz frequency
      oscillator.type = 'sine';

      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      // Play sound
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);

    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Play a double beep for important notifications
  playDoubleBeep() {
    this.playNotificationBeep();
    setTimeout(() => {
      this.playNotificationBeep();
    }, 200);
  }

  // Play a success sound (higher pitch)
  playSuccessSound() {
    if (!this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Higher pitch for success
      oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);

    } catch (error) {
      console.warn('Failed to play success sound:', error);
    }
  }
}

// Create singleton instance
const soundUtils = new SoundUtils();

export default soundUtils;