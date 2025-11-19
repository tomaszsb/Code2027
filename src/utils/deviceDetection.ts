// src/utils/deviceDetection.ts

/**
 * Device type classification for adaptive UI rendering
 */
export type DeviceType = 'mobile' | 'desktop';

/**
 * Detects the device type based on user agent and screen characteristics
 *
 * Detection strategy:
 * 1. Check user agent string for known mobile patterns
 * 2. Fall back to touch capability + screen size for edge cases
 *
 * @returns 'mobile' for phones/tablets, 'desktop' for computers
 */
export function detectDeviceType(): DeviceType {
  // Check user agent for mobile patterns
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  if (mobileRegex.test(userAgent)) {
    return 'mobile';
  }

  // Fallback: Check for touch + small screen (catches edge cases)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;

  return (hasTouch && isSmallScreen) ? 'mobile' : 'desktop';
}

/**
 * Generate a unique session ID for tracking device sessions
 * Format: session_<timestamp>_<random>
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `session_${timestamp}_${random}`;
}
