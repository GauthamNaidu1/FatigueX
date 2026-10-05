# MOBILE CAMERA TROUBLESHOOTING

If you encounter issues acquiring the camera on a mobile device, check the following error codes and solutions:

## 1. InsecureContext (or getUserMedia undefined)
- **Symptom**: The app says "Camera access requires a secure HTTPS connection" or the MediaDevices API is reported as UNAVAILABLE.
- **Cause**: You are accessing the application over a standard `http://` IP address. Modern mobile browsers block camera access on non-secure origins.
- **Fix**: Use HTTPS via `ngrok` or the Vite SSL plugin (see `MOBILE_TEST_SETUP.md`).

## 2. NotAllowedError (Camera Permission Denied)
- **Symptom**: The browser prompts for permission, you accidentally click "Deny", and the app reports a permission error.
- **Cause**: The browser has permanently blocked camera access for this site.
- **Fix**: 
  - On iOS Safari: Tap the `aA` icon in the URL bar, go to Website Settings, and allow the camera.
  - On Android Chrome: Tap the padlock/settings icon in the URL bar, go to Permissions, and allow the camera.

## 3. NotReadableError (Camera Already in Use)
- **Symptom**: The app says "Camera is already in use by another application."
- **Cause**: Another app (like Zoom, WhatsApp, or the native Camera app) is currently holding a hardware lock on the camera.
- **Fix**: Force close the competing applications. On some Android devices, the flashlight being on can also lock the camera.

## 4. NotFoundError (No Camera Device Found)
- **Symptom**: The app reports that no camera device was found.
- **Cause**: The device has no physical camera, or a corporate MDM (Mobile Device Management) profile has disabled the camera hardware entirely.
- **Fix**: Verify the native camera app works.

## 5. OverconstrainedError
- **Symptom**: "Camera constraints could not be satisfied."
- **Cause**: The application requested a specific camera feature (like a precise resolution or specific facingMode) that the phone physically does not have.
- **Fix**: The application is configured to request `ideal` constraints rather than `exact` constraints, which prevents this error in 99% of cases. If this still happens, try switching the camera (front vs rear) or resetting the browser.

## 6. SecurityError / Certificate Trust Problems
- **Symptom**: The page refuses to load entirely, showing a red "Your connection is not private" error.
- **Cause**: When using Vite's local Basic SSL plugin, the browser does not recognize the temporary certificate authority.
- **Fix**: On the warning screen, tap "Advanced", then tap "Proceed to site (unsafe)". The browser will then allow the connection, and the Secure Context will activate.

## General Best Practices
- Do NOT use obscure browsers or in-app browsers (like the Instagram or Reddit built-in browsers). Always open the link in the native Safari or Chrome app.
- Ensure your phone is NOT in "Low Power Mode" or "Battery Saver Mode", as this can heavily throttle the JavaScript frame rate required for the MediaPipe AI.
