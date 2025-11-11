# Operational Guidelines

## Network & Authentication
- Allow CORS exclusively for kiosk and panel origins; reject wildcard origins in the gateway.
- Keep the `usuario_totem` credentials off the device. Provision a short-lived token via secure channel and expose it through `VITE_TOTEM_USERNAME` / `VITE_TOTEM_PASSWORD`.
- To invalidate the kiosk session, call the backend logout endpoint; the UI has no logout control by design.

## Environment Variables
- `VITE_API_BASE_URL`: HTTPS endpoint for the hospital APIs.
- `VITE_PANEL_WS_URL`: Optional WebSocket URL for real-time panel updates.
- `VITE_SURVEY_FORM_URL`: Public satisfaction survey link rendered as QR code on the confirmation step.
- `VITE_INACTIVITY_TIMEOUT_MS`: Milliseconds before the kiosk resets to the first screen (default ~3 min).

## Responsive Behaviour
- The wizard layout switches to condensed progress text on phones, with stepper dots on larger screens.
- Disable kiosk fullscreen UI chrome using the browser’s kiosk mode; the SPA also works on mobile when opened via QR code.
- Test on a phone breakpoint (≤600 px) and on the kiosk resolution configured for production.

## Panel Audio & Alerts
- The panel exposes a speaker toggle (default muted). Provide external speakers where audible alerts are required.
- Replace `frontend/src/features/panel/assets/chime.mp3` with the desired chime complying with the facility’s volume policy.

## Data Hygiene
- Intake data is cleared on inactivity or when a submission is completed. Confirm the device runs with a locked-down OS user.
- Avoid storing patient information in browser storage; the application keeps everything in memory and resets after each visit.

