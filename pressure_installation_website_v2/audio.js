// AUDIO ENGINE — Tone.js
// Loaded by index.html before sketch.js.
// The pressure value from sketch.js controls melody density, tempo, register and intensity.

let leadSynth;
let chordSynth;
let reverb;
let melodyLoop;
let audioReady = false;
let melodyStep = 0;
let currentPressure = 0;

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

  reverb = new Tone.Reverb({ decay: 4.5, wet: 0.32 }).toDestination();
  await reverb.generate();

  leadSynth = new Tone.FMSynth({
    harmonicity: 2,
    modulationIndex: 3,
    oscillator: { type: "sine" },
    envelope: { attack: 0.04, decay: 0.25, sustain: 0.25, release: 1.2 },
    modulation: { type: "triangle" },
    modulationEnvelope: { attack: 0.08, decay: 0.2, sustain: 0.15, release: 0.8 }
  }).connect(reverb);

  chordSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.8, decay: 1.5, sustain: 0.35, release: 2.5 }
  }).connect(reverb);

  Tone.Transport.bpm.value = 76;

  melodyLoop = new Tone.Loop((time) => {
    if (currentPressure < 0.06) return;

    const step = melodyStep % melodyPattern.length;
    let noteIndex = melodyPattern[step];

    // Preserve a recognizable melodic contour with occasional variations.
    if (melodyStep > 0 && melodyStep % 8 === 0 && Math.random() < 0.35) {
      noteIndex = (noteIndex + 1 + Math.floor(Math.random() * 2)) % scaleNotes.length;
    }

    let note = scaleNotes[noteIndex];

    // Stronger pressure occasionally moves the melody up an octave.
    if (currentPressure > 0.72 && Math.random() < 0.45) {
      note = Tone.Frequency(note).transpose(12).toNote();
    }

    const velocity = 0.12 + currentPressure * 0.48;
    leadSynth.triggerAttackRelease(
      note,
      currentPressure > 0.65 ? "8n" : "4n",
      time,
      velocity
    );

    // Add a sustained chord at the beginning of each phrase.
    if (step === 0 && currentPressure > 0.32) {
      const chordIndex = Math.floor(melodyStep / 8) % chordProgression.length;
      chordSynth.triggerAttackRelease(
        chordProgression[chordIndex],
        "2n",
        time,
        0.08 + currentPressure * 0.16
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

  if (audioReady) {
    const targetBpm = 66 + currentPressure * 62;
    Tone.Transport.bpm.rampTo(targetBpm, 0.15);
  }
}

function playPressureOnset() {
  if (audioReady && leadSynth) {
    leadSynth.triggerAttackRelease("D4", "8n", undefined, 0.12);
  }
}

function releasePressureSound() {
  if (audioReady && leadSynth) {
    leadSynth.triggerRelease();
  }
}
