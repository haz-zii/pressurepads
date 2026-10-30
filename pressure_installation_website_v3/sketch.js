let serialPort;
let serialReader;
let serialBuffer = "";
let connectInProgress = false;

let pressureValue = 1023;
let pressureAmount = 0;
let pressureThreshold = 800;
let wasPressed = false;

function setup() {
  const canvas = createCanvas(960, 540);
  canvas.elt.setAttribute("aria-label", "Pressure-reactive audiovisual artwork");
  pixelDensity(1);
  frameRate(24);
  noStroke();

  // Connect the existing HTML buttons; do not create duplicate p5 buttons.
  document.getElementById("connectButton")?.addEventListener("click", connectArduino);
  document.getElementById("fullscreenButton")?.addEventListener("click", toggleProjector);
}

async function connectArduino() {
  const status = document.getElementById("status");
  if (connectInProgress || serialReader) return;

  try {
    if (!("serial" in navigator)) {
      if (status) {
        status.textContent = window.isSecureContext
          ? "WEB SERIAL: USE CHROME"
          : "WEB SERIAL: OPEN VIA LOCALHOST";
      }
      return;
    }

    connectInProgress = true;
    if (status) status.textContent = "ARDUINO: SELECT PORT";

    // Both calls must start in this click, before any await. requestPort()
    // otherwise loses the gesture, and Tone.start() needs it as well.
    const portPromise = navigator.serial.requestPort();
    const audioPromise = setupAudio().catch((error) => {
      console.error("Audio setup error:", error);
    });

    serialPort = await portPromise;
    await serialPort.open({ baudRate: 9600 });

    const decoder = new TextDecoderStream();
    serialPort.readable.pipeTo(decoder.writable).catch(async (error) => {
      console.error("Serial stream error:", error);
      await releaseSerialPort();
      if (status) status.textContent = "ARDUINO: CONNECTION LOST";
    });
    serialReader = decoder.readable.getReader();

    if (status) status.textContent = "ARDUINO: CONNECTED";
    await audioPromise;
    readSerial();
  } catch (error) {
    console.error("Arduino connection error:", error);
    await releaseSerialPort();
    if (status) status.textContent = connectionStatusForError(error);
  } finally {
    connectInProgress = false;
  }
}

async function releaseSerialPort() {
  const reader = serialReader;
  const port = serialPort;
  serialReader = undefined;
  serialPort = undefined;
  try { reader?.releaseLock(); } catch (error) { /* already released */ }
  try { await port?.close(); } catch (error) { /* already closed */ }
}

function connectionStatusForError(error) {
  if (error?.name === "NotFoundError") return "ARDUINO: DISCONNECTED";
  if (error?.name === "NotAllowedError") return "ARDUINO: SERIAL BLOCKED";
  if (error?.name === "NetworkError") return "ARDUINO: PORT BUSY";
  return "ARDUINO: NOT CONNECTED";
}

async function readSerial() {
  try {
    const result = await serialReader.read();
    if (result.done) {
      await releaseSerialPort();
      const status = document.getElementById("status");
      if (status) status.textContent = "ARDUINO: CONNECTION LOST";
      return;
    }

    serialBuffer += result.value;
    const serialLines = serialBuffer.split("\n");
    serialBuffer = serialLines.pop();

    for (const serialLine of serialLines) {
      const reading = Number(serialLine.trim());
      if (Number.isFinite(reading)) {
        pressureValue = constrain(reading, 0, 1023);
        const status = document.getElementById("status");
        if (status) status.textContent = `ARDUINO: CONNECTED ${Math.round(pressureValue)}`;
      }
    }
    readSerial();
  } catch (error) {
    console.error("Serial reading error:", error);
    await releaseSerialPort();
    const status = document.getElementById("status");
    if (status) status.textContent = "ARDUINO: CONNECTION LOST";
  }
}

function toggleProjector() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
    document.body.classList.add("projector");
  } else {
    document.exitFullscreen?.();
    document.body.classList.remove("projector");
  }
}

function draw() {
  background(8, 5, 20);

  // Lower sensor values indicate more pressure on this pad.
  const isPressed = pressureValue < pressureThreshold;
  const pressureTarget = isPressed
    ? constrain(map(pressureValue, pressureThreshold, 0, 0, 1), 0, 1)
    : 0;

  pressureAmount = lerp(pressureAmount, pressureTarget, 0.12);
  if (typeof updateAudioPressure === "function") updateAudioPressure(pressureAmount);

  if (isPressed && !wasPressed && typeof playPressureOnset === "function") playPressureOnset();
  if (!isPressed && wasPressed && typeof releasePressureSound === "function") releasePressureSound();
  wasPressed = isPressed;

  if (pressureAmount > 0.008) drawGenerativeVisual();
}

function drawGenerativeVisual() {
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y += 20) {
    for (let x = 0; x < width; x += 20) {
      const radialDistance = dist(x, y, centerX, centerY);
      const wave = sin(radialDistance * 0.025 - frameCount * 0.035);
      const secondaryWave = cos(x * 0.018 + y * 0.024 + frameCount * 0.022);

      const red = map(sin(radialDistance * 0.014 + frameCount * 0.018), -1, 1, 90, 255);
      const green = map(sin(x * 0.018 + frameCount * 0.012), -1, 1, 15, 210);
      const blue = map(cos(y * 0.019 + frameCount * 0.016), -1, 1, 110, 255);

      fill(red, green, blue, 210 * pressureAmount);
      rect(
        x + wave * 30 * pressureAmount,
        y + secondaryWave * 18 * pressureAmount,
        7 + pressureAmount * 5,
        7 + pressureAmount * 5
      );
    }
  }
}
