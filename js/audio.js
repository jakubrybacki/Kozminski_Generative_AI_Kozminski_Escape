/**
 * KOZMINSKI ESCAPE: POLOWANIE NA ECTS
 * Plik: js/audio.js
 * Obiekt SoundSystem - 8-bitowy syntezator audio retro
 * Oparty w 100% na Web Audio API (bez zewnętrznych plików .mp3 ani .wav)
 */

const SoundSystem = {
  ctx: null,
  isMuted: false,

  /**
   * Inicjalizacja AudioContext przy pierwszej interakcji użytkownika
   */
  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  /**
   * Przełączenie wyciszenia dźwięków
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  },

  /**
   * Odtwarzanie 8-bitowych efektów syntezowanych w czasie rzeczywistym
   * @param {string} type - 'ects' | 'coffee' | 'shield' | 'freeze' | 'hit' | 'win'
   */
  play(type) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (type) {
      // 1. 'ects': melodyjny dwuton monety (fala trójkątna)
      case 'ects': {
        const tone1 = this.ctx.createOscillator();
        const tone2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        tone1.type = 'triangle';
        tone2.type = 'triangle';

        // Pierwszy ton: B5 (~987.77 Hz) przez 0.07s
        tone1.frequency.setValueAtTime(987.77, now);
        // Drugi ton: E6 (~1318.51 Hz) od 0.07s do 0.25s
        tone2.frequency.setValueAtTime(1318.51, now + 0.07);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.setValueAtTime(0.22, now + 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        tone1.connect(gain);
        tone2.connect(gain);
        gain.connect(this.ctx.destination);

        tone1.start(now);
        tone1.stop(now + 0.07);

        tone2.start(now + 0.07);
        tone2.stop(now + 0.28);
        break;
      }

      // 2. 'coffee': dźwięk przyspieszenia (rosnąca częstotliwość fali piłokształtnej)
      case 'coffee': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        // Płynny sweep częstotliwości od niskiego rejestru do pędzącego tonu retro
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);
        osc.frequency.exponentialRampToValueAtTime(1174, now + 0.4);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.42);
        break;
      }

      // 3. 'shield': aktywacja legitymacji studenckiej (akord sinusoidalny)
      case 'shield': {
        // Czysty akord durowy: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz)
        const chordFreqs = [523.25, 659.25, 783.99];
        const masterGain = this.ctx.createGain();

        masterGain.gain.setValueAtTime(0.16, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        masterGain.connect(this.ctx.destination);

        chordFreqs.forEach((freq) => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          // Delikatne wznoszące vibrato
          osc.frequency.exponentialRampToValueAtTime(freq * 1.04, now + 0.35);

          osc.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.55);
        });
        break;
      }

      // 4. 'freeze': cyber-freeze AI po zadanym pytaniu (fala prostokątna)
      case 'freeze': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        // Szorstki, cyfrowy glitch 8-bitowy (szybkie oscylacje kwadratowe)
        const freezeNotes = [740, 520, 680, 410, 620, 310, 500];
        const step = 0.045;

        freezeNotes.forEach((f, i) => {
          osc.frequency.setValueAtTime(f, now + i * step);
        });

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (freezeNotes.length * step) + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + (freezeNotes.length * step) + 0.05);
        break;
      }

      // 5. 'hit': złapanie przez egzaminatora (dramatycznie opadający bas)
      case 'hit': {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        // Dramatyczny spadek częstotliwości z mocnego uderzenia do submruku
        bassOsc.frequency.setValueAtTime(260, now);
        bassOsc.frequency.exponentialRampToValueAtTime(75, now + 0.18);
        bassOsc.frequency.exponentialRampToValueAtTime(32, now + 0.55);

        bassGain.gain.setValueAtTime(0.28, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + 0.58);
        break;
      }

      // 6. 'win': krótka, 4-tonowa fanfara sukcesu
      case 'win': {
        // Czysta 8-bitowa fanfara retro: G4 -> C5 -> E5 -> G5
        const fanfareNotes = [
          { freq: 392.00, dur: 0.12 }, // G4
          { freq: 523.25, dur: 0.12 }, // C5
          { freq: 659.25, dur: 0.14 }, // E5
          { freq: 783.99, dur: 0.55 }  // G5 (zwieńczenie)
        ];

        let cursor = now;
        fanfareNotes.forEach((note, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.freq, cursor);

          gain.gain.setValueAtTime(0.22, cursor);
          const fadeDuration = idx === fanfareNotes.length - 1 ? 0.55 : 0.11;
          gain.gain.exponentialRampToValueAtTime(0.001, cursor + fadeDuration);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(cursor);
          osc.stop(cursor + fadeDuration);

          cursor += note.dur;
        });
        break;
      }

      default:
        console.warn(`[SoundSystem] Nieznany typ dźwięku: ${type}`);
    }
  }
};

// Udostępnienie w przestrzeni globalnej window
window.SoundSystem = SoundSystem;
// Kompatybilność wsteczna z poprzednimi wywołaniami gameAudio
window.gameAudio = {
  initAudioContext: () => SoundSystem.init(),
  toggleMute: () => SoundSystem.toggleMute(),
  playCollectECTS: () => SoundSystem.play('ects'),
  playCoffeeBoost: () => SoundSystem.play('coffee'),
  playIDCardShield: () => SoundSystem.play('shield'),
  playProfessorAlert: () => SoundSystem.play('freeze'),
  playGameOver: () => SoundSystem.play('hit'),
  playVictory: () => SoundSystem.play('win')
};
