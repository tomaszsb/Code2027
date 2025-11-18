/**
 * Network Detection Utility
 *
 * Provides utilities for detecting the local network IP address
 * and generating player-specific connection URLs for multi-player setup.
 */

/**
 * Get the local IP address for the game server
 *
 * In a browser environment, this uses window.location.hostname
 * which will be the IP address or hostname where the app is being served.
 *
 * For development with Vite, the network address is automatically detected
 * and available at the hostname.
 *
 * @returns The IP address or hostname of the server
 */
export const getLocalIPAddress = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }

  // Fallback for SSR or non-browser environments
  return 'localhost';
};

/**
 * Get the current port number
 *
 * @returns The port number as a string, or '3000' as default
 */
export const getPort = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.port || '3000';
  }
  return '3000';
};

/**
 * Check if we're running on localhost
 *
 * @returns True if running on localhost, false otherwise
 */
export const isLocalhost = (): boolean => {
  const hostname = getLocalIPAddress();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

/**
 * Generate a complete server URL with optional player ID
 *
 * @param playerId Optional player ID to include in URL params
 * @returns Full URL for connecting to the game server
 */
export const getServerURL = (playerId?: string): string => {
  const hostname = getLocalIPAddress();
  const port = getPort();
  const protocol = window.location.protocol || 'http:';

  // Build base URL
  const baseURL = port && port !== '80' && port !== '443'
    ? `${protocol}//${hostname}:${port}`
    : `${protocol}//${hostname}`;

  // Add player ID if provided
  const playerParam = playerId ? `?playerId=${playerId}` : '';

  return `${baseURL}${playerParam}`;
};

/**
 * Generate a network URL (non-localhost) for display purposes
 *
 * @returns A user-friendly network URL, or localhost if not on network
 */
export const getNetworkURL = (): string => {
  const hostname = getLocalIPAddress();
  const port = getPort();

  if (isLocalhost()) {
    return `localhost:${port}`;
  }

  return port && port !== '80' && port !== '443'
    ? `${hostname}:${port}`
    : hostname;
};

/**
 * Copy text to clipboard with fallback support
 *
 * @param text Text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Get connection instructions based on network status
 *
 * @returns User-friendly connection instructions
 */
export const getConnectionInstructions = (): string => {
  if (isLocalhost()) {
    return '⚠️ Running on localhost. To connect from other devices, make sure Vite is using --host flag and devices are on the same WiFi network.';
  }

  return '📱 Make sure all devices are on the same WiFi network to connect.';
};
