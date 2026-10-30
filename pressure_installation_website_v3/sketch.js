let serialPort;
let serialReader;
let serialBuffer = "";

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
  try {
    if (!("serial" in navigator)) {
      if (status) status.textContent = "WEB SERIAL: USE CHROME";
      return;
    }

    await setupAudio();
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });

    const decoder = new TextDecoderStream();
    serialPort.readable.pipeTo(decoder.writable);
    serialReader = decoder.readable.getReader();

    if (status) status.textContent = "ARDUINO: CONNECTED";
    readSerial();
  } catch (error) {
    console.error("Arduino connection error:", error);
    if (status) status.textContent = "ARDUINO: NOT CONNECTED";
  }
}

async function readSerial() {
  try {
    const result = await serialReader.read();
    if (result.done) return;

    serialBuffer += result.value;
    const serialLines = serialBuffer.split("\n");
    serialBuffer = serialLines.pop();

    for (const serialLine of serialLines) {
      const reading = Number(serialLine.trim());
      if (Number.isFinite(reading)) pressureValue = constrain(reading, 0, 1023);
    }
    readSerial();
  } catch (error) {
    console.error("Serial reading error:", error);
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
