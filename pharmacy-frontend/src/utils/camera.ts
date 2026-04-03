/** True when the browser can request a camera (HTTPS or localhost). */
export function canUseBarcodeCamera(): boolean {
  if (typeof window === "undefined") return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  if (window.isSecureContext) return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}
