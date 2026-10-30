PRESSURE — WEBSITE STARTER (SPLIT FILE VERSION)

FILES
- index.html: website shell, CSS, p5.js and Tone.js libraries; loads audio.js and sketch.js.
- sketch.js: p5.js visuals and Arduino Web Serial input.
- audio.js: Tone.js generative melodic audio engine.
- README.txt: setup instructions.

IMPORTANT
All four files must stay in the same folder. Do not move audio.js into a separate folder
unless you also update its script path in index.html.

REQUIREMENTS
- Google Chrome with Web Serial support.
- Arduino Mega connected by USB.
- Arduino sketch sends one A0 analog reading per line at 9600 baud.
- Close Arduino IDE Serial Monitor before connecting from the website.
- Web Serial requires HTTPS or localhost.

TEST LOCALLY
1. Extract the ZIP.
2. Open Terminal in the extracted folder.
3. Run: python3 -m http.server 8000
4. Open http://localhost:8000 in Chrome.
5. Click CONNECT ARDUINO and select the Mega.
6. Press the pressure pad.
7. Click FULL SCREEN for projection.

SENSOR CALIBRATION
This version assumes released readings are above 800 and pressure lowers the reading.
Adjust pressureThreshold in sketch.js to a value between your released and pressed readings.

SONIC DESIGN
audio.js generates a melodic line from a D minor pentatonic note set, with occasional
variations, pressure-controlled tempo/register/velocity, sustained chords, FM synthesis,
and reverb. It is generated live rather than played from fixed recordings.
