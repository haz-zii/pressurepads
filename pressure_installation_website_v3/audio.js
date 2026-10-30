// AUDIO ENGINE — optimized Tone.js melodic system
let leadSynth;
let chordSynth;
let reverb;
let melodyLoop;
let audioReady = false;
let melodyStep = 0;
let currentPressure = 0;
let lastTempoUpdate = 0;
let lastTempo = 76;

const scaleNotes = ["D4", "F4", "G4", "A4", "C5", "D5", "F5", "G5"];
const melodyPattern = [0, 2, 4, 3, 1, 3, 5, 4];
const chordProgression = [
  ["D3", "A3", "D4"],
  ["F3", "C4", "F4"],
  ["G3", "D4", "G4"],
  ["C3", "G3", "C4"]
];

async function setupAudio() {
  if (audioReady) return;
  await Tone.start();

  reverb = new Tone.Reverb({ decay: 3.5, wet: 0.25 }).toDestination();
  await reverb.generate();

  leadSynth = new Tone.FMSynth({
    harmonicity: 2,
    modulationIndex: 2.5,
    oscillator: { type: "sine" },
    envelope: { attack: 0.05, decay: 0.22, sustain: 0.2, release: 0.8 },
    modulation: { type: "triangle" },
    modulationEnvelope: { attack: 0.06, decay: 0.2, sustain: 0.1, release: 0.5 }
  }).connect(reverb);

  chordSynth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 6,
    oscillator: { type: "sine" },
    envelope: { attack: 0.7, decay: 1.1, sustain: 0.25, release: 1.8 }
  }).connect(reverb);

  Tone.Transport.bpm.value = 76;

  melodyLoop = new Tone.Loop((time) => {
    if (currentPressure < 0.08) return;

    const step = melodyStep % melodyPattern.length;
    let noteIndex = melodyPattern[step];

    if (melodyStep > 0 && melodyStep % 8 === 0 && Math.random() < 0.25) {
      noteIndex = (noteIndex + 1 + Math.floor(Math.random() * 2)) % scaleNotes.length;
    }

    let note = scaleNotes[noteIndex];
    if (currentPressure > 0.75 && Math.random() < 0.3) {
      note = Tone.Frequency(note).transpose(12).toNote();
    }

    leadSynth.triggerAttackRelease(
      note,
      currentPressure > 0.65 ? "8n" : "4n",
      time,
      0.10 + currentPressure * 0.38
    );

    if (step === 0 && currentPressure > 0.38) {
      const chordIndex = Math.floor(melodyStep / 8) % chordProgression.length;
      chordSynth.triggerAttackRelease(
        chordProgression[chordIndex], "2n", time, 0.07 + currentPressure * 0.12
      );
    }
    melodyStep++;
  }, "8n");

  melodyLoop.start(0);
  Tone.Transport.start();
  audioReady = true;
}

function updateAudioPressure(amount) {
  currentPressure = Math.max(0, Math.min(1, amount));

  // Update tempo at most five times per second, not on every p5 draw frame.
  const now = performance.now();
  if (audioReady && now - lastTempoUpdate > 200) {
    const targetTempo = Math.round(66 + currentPressure * 54);
    if (Math.abs(targetTempo - lastTempo) >= 2) {
      Tone.Transport.bpm.value = targetTempo;
      lastTempo = targetTempo;
    }
    lastTempoUpdate = now;
  }
}

function playPressureOnset() {
  if (audioReady && leadSynth) {
    leadSynth.triggerAttackRelease("D4", "8n", undefined, 0.10);
  }
}

function releasePressureSound() {
  if (audioReady && leadSynth) leadSynth.triggerRelease();
}
