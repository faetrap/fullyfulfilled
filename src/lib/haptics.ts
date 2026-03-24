export const supportsHaptics: boolean =
  typeof navigator !== "undefined" && "vibrate" in navigator;

function vibrate(pattern: number | number[]): void {
  if (supportsHaptics) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently ignore — some browsers throw on vibrate
    }
  }
}

export function hapticLight(): void {
  vibrate(10);
}

export function hapticMedium(): void {
  vibrate(25);
}

export function hapticSuccess(): void {
  vibrate([10, 50, 10]);
}
