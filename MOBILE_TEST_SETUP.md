# MOBILE TEST SETUP

To test the mobile interface on a real Android or iOS device over a local network, you must satisfy modern browser security requirements.

## The HTTPS / Secure Context Requirement
Modern mobile browsers (Chrome, Safari, Firefox) **STRICTLY REQUIRE** a Secure Context (HTTPS or `localhost`) to grant access to the `MediaDevices.getUserMedia()` API. 

If you try to access the application on your phone using a local IP (e.g., `http://192.168.1.4:5173`), the camera request will **fail silently or immediately trigger a NotAllowedError**, because `http://<ip-address>` is not considered a secure context.

## How to Test on a Real Mobile Device

You have three options for testing on a real device on your LAN:

### Option 1: Use ngrok (Recommended & Easiest)
`ngrok` creates a secure HTTPS tunnel to your local development server.

1. Install `ngrok` (if you haven't already).
2. Start the local dev server: 
   ```bash
   npm run dev
   ```
3. In a new terminal, run:
   ```bash
   ngrok http 5173
   ```
4. Ngrok will provide an HTTPS URL (e.g., `https://a1b2c3d4.ngrok-free.app`).
5. Open that EXACT HTTPS URL on your mobile phone's browser.

### Option 2: Use Vite Basic SSL Plugin
You can instruct Vite to generate temporary self-signed SSL certificates so that you can serve over HTTPS directly.

1. Install the plugin:
   ```bash
   npm install --save-dev @vitejs/plugin-basic-ssl
   ```
2. Update `vite.config.ts`:
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import basicSsl from '@vitejs/plugin-basic-ssl'

   export default defineConfig({
     plugins: [react(), basicSsl()],
     server: {
       host: '0.0.0.0'
     }
   })
   ```
3. Run `npm run dev`.
4. Open the `https://<your-ip>:5173` link on your phone. You will see a "Your connection is not private" warning. You must click "Advanced" -> "Proceed to site (unsafe)".

### Option 3: Production Deployment
Deploy the `dist/` folder to a platform that provides automatic HTTPS (e.g., Vercel, Netlify, Firebase Hosting, or GitHub Pages). 

1. Run the build command:
   ```bash
   npm run build
   ```
2. Deploy the resulting `dist/` folder.
3. Access the deployed `.com` or `.app` URL on your phone.

## Camera Permission Requirements

When you load the app correctly via HTTPS, you will be prompted:
`"[App] wants to use your camera"`

1. You **MUST** tap "Allow".
2. If you tap "Deny", the app will display a "Camera permission denied" error in the UI.
3. If this happens, you must go into your mobile browser settings (Site Settings) and clear the permission memory for the site to prompt again.

## Android / iOS Testing Instructions

1. **Center & Off-center test**: Keep the phone steady on a desk or tripod. Walk into the frame. Move left and right. Verify the skeleton rigidly overlays your body.
2. **Portrait Mode**: Hold the phone vertically. The interface will stack the camera feed in a 3:4 aspect ratio. Verify you can see your body clearly.
3. **Landscape Mode**: Turn the phone horizontally. The camera will switch to a 4:3 ratio with a max height to prevent scrolling away from the controls.
4. **Camera Switching**: Tap the `🔄 Switch` button above the camera feed. Verify you can switch between the selfie camera (which mirrors your movement) and the rear camera (which acts like a normal recording).
5. **Session Recording**: Press "Start Monitoring". Perform a task (e.g., leaning over to simulate fatigue) for 15-30 seconds. Press "Stop". Verify that the session appears in the underlying history/store correctly without crashing.

## Troubleshooting

- **Camera feed is black**: Ensure you are not in another app (like Zoom or the native Camera app) that is monopolizing the camera hardware.
- **"Camera Error: Browser API not supported"**: You are opening the site via HTTP instead of HTTPS.
- **Stuttering / High Latency**: MediaPipe runs on WebAssembly and heavily utilizes the device's CPU/GPU. Ensure Low Power Mode/Battery Saver is turned OFF on your phone, as it aggressively throttles JavaScript execution.
