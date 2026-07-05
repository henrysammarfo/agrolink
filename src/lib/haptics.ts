/** Light haptic feedback for double-tap like (mobile PWA). */

export function triggerLikeHaptic() {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(12);
  } catch {
    /* unsupported */
  }
}
