PRESSURE INSTALLATION — V3 PERFORMANCE FIX

Files:
- index.html
- sketch.js
- audio.js
- README.txt

This version addresses browser freezing by:
- Updating Tone.js tempo at most five times per second, rather than on every animation frame.
- Reducing visual draw calls by using a 20px grid.
- Reducing p5.js frame rate to 24 FPS.
- Limiting synthesizer polyphony.

Deployment:
Upload/replace all four files together on your hosting platform. Do not mix old and new versions.
Then wait for the deployment to finish and hard-refresh the website (Cmd+Shift+R).

Testing:
Use Chrome, close Arduino Serial Monitor, open the HTTPS website, click CONNECT ARDUINO,
select the Mega, and press the pad. If it still freezes, test the page once without Arduino
connected; this will help isolate whether the issue is rendering/audio or serial input.

Arduino:
Keep the existing A0 sketch that prints one analog value per line at 9600 baud.
