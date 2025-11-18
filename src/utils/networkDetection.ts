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
 * Get the complete server URL with optional player ID parameter
 *
 * @param playerId - Optional player ID to include in URL query params
 * @returns Complete URL string (e.g., "http://192.168.1.100:5173?playerId=player-1")
 */
export const getServerURL = (playerId?: string): string => {
  const hostname = getLocalIPAddress();
  const port = window.location.port;
  const protocol = window.location.protocol;

  // Build base URL
  const baseURL = port
    ? `${protocol}//${hostname}:${port}`
    : `${protocol}//${hostname}`;

  // Add player ID parameter if provided
  const playerParam = playerId ? `?playerId=${playerId}` : '';

  return `${baseURL}${playerParam}`;
};

/**
 * Get the network URL for display purposes
 * Shows the full network address that other devices should use
 *
 * @returns Network URL string without player ID
 */
export const getNetworkURL = (): string => {
  return getServerURL();
};

/**
 * Copy text to clipboard
 *
 * @param text - Text to copy
 * @returns Promise that resolves when copy is successful
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Check if we're running on localhost
 * Useful for showing different instructions for local vs network play
 *
 * @returns True if hostname is localhost or 127.0.0.1
 */
export const isLocalhost = (): boolean => {
  const hostname = getLocalIPAddress();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
};

/**
 * Get helpful connection instructions based on environment
 *
 * @returns Object with connection instructions
 */
export const getConnectionInstructions = (): {
  title: string;
  steps: string[];
  warnings?: string[];
} => {
  const isLocal = isLocalhost();

  if (isLocal) {
    return {
      title: 'Local Development Mode',
      steps: [
        '1. For network play, start Vite with --host flag: npm run dev -- --host',
        '2. Use the network IP address shown in the terminal',
        '3. Ensure all devices are on the same WiFi network'
      ],
      warnings: [
        'Currently using localhost - only accessible from this device',
        'Other players cannot connect using localhost address'
      ]
    };
  }

  return {
    title: 'Multi-Player Connection',
    steps: [
      '1. Ensure all devices are on the same WiFi network',
      '2. Each player scans their QR code or visits their URL',
      '3. Wait for all players to connect before starting'
    ]
  };
};
