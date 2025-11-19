// src/utils/deviceDetection.ts
// Device detection utility for smart layout adaptation

export type DeviceType = 'mobile' | 'desktop';

/**
 * Detects the device type based on user agent and screen characteristics
 * @returns 'mobile' or 'desktop'
 */
export function detectDeviceType(): DeviceType {
  // Check user agent string for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  if (mobileRegex.test(userAgent)) {
    return 'mobile';
  }

  // Additional checks for touch-enabled small screens
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;

  return (hasTouch && isSmallScreen) ? 'mobile' : 'desktop';
}

/**
 * Get the backend URL based on environment
 * @returns The backend API URL
 */
export function getBackendURL(): string {
  // Use environment variable if available, otherwise default to localhost
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
}
