
let serialPort;
let serialReader;
let serialBuffer = "";

let pressureValue = 1023;
let pressureAmount = 0;
let pressureThreshold = 800;
let wasPressed = false;

function setup() {
  createCanvas(960, 540);
  pixelDensity(1);
  frameRate(24);
  noStroke();

  let connectButton = createButton("CONNECT ARDUINO");
  connectButton.position(10, 10);
  connectButton.mousePressed(connectArduino);

  let fullscreenButton = createButton("FULL SCREEN");
  fullscreenButton.position(160, 10);
  fullscreenButton.mousePressed(toggleProjector);
}

async function connectArduino() {
  try {
    await setupAudio();

    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });

    const decoder = new TextDecoderStream();
    serialPort.readable.pipeTo(decoder.writable);
    serialReader = decoder.readable.getReader();

    document.getElementById("status")?.remove();
    console.log("Arduino connected!");

    readSerial();
  } catch (error) {
    console.log("Connection error:", error);
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

      if (Number.isFinite(reading)) {
        pressureValue = constrain(reading, 0, 1023);
      }
    }

    readSerial();
  } catch (error) {
    console.log("Serial reading error:", error);
  }
}

function toggleProjector() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function draw() {
  background(8, 5, 20);

  // TEMPORARY: pressure detection
  const isPressed = pressureValue < pressureThreshold;

  const pressureTarget = isPressed
    ? constrain(map(pressureValue, pressureThreshold, 0, 0, 1), 0, 1)
    : 0;

  pressureAmount = lerp(pressureAmount, pressureTarget, 0.12);

  updateAudioPressure(pressureAmount);

  if (isPressed && !wasPressed) playPressureOnset();
  if (!isPressed && wasPressed) releasePressureSound();

  wasPressed = isPressed;

  if (pressureAmount > 0.008) {
    drawGenerativeVisual();
  }

  // DIAGNOSTIC DISPLAY
  fill(255);
  textSize(16);

  text("RAW SENSOR READING: " + pressureValue, 20, 65);
  text("PRESSURE THRESHOLD: " + pressureThreshold, 20, 90);
  text("DETECTION: " + (isPressed ? "PRESSED" : "RELEASED"), 20, 115);
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
