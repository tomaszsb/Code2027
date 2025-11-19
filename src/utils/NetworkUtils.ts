// src/utils/NetworkUtils.ts

/**
 * Network utilities for player connection via QR codes
 */

export interface NetworkInfo {
  hostname: string;
  port: string;
  protocol: string;
  baseUrl: string;
}

/**
 * Get current network information for the running application
 * @returns NetworkInfo object with connection details
 */
export function getNetworkInfo(): NetworkInfo {
  const hostname = window.location.hostname;
  const port = window.location.port || '3000';
  const protocol = window.location.protocol;
  const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

  return {
    hostname,
    port,
    protocol,
    baseUrl
  };
}

/**
 * Generate a server URL for a specific player
 * This URL can be encoded in a QR code for easy mobile access
 * @param playerId - The unique identifier for the player
 * @returns Full URL string that can be used in QR code
 */
export function getServerURL(playerId: string): string {
  const networkInfo = getNetworkInfo();

  // For now, just return the base URL with player ID as query param
  // This can be extended to include specific player routes if needed
  return `${networkInfo.baseUrl}?player=${playerId}`;
}

/**
 * Get the local network IP address hint
 * Note: Browser security prevents direct IP detection
 * This returns the hostname which might be localhost or an IP
 * @returns String with connection instructions
 */
export function getLocalNetworkHint(): string {
  const networkInfo = getNetworkInfo();

  if (networkInfo.hostname === 'localhost' || networkInfo.hostname === '127.0.0.1') {
    return 'To connect from other devices, replace "localhost" with your computer\'s IP address (e.g., 192.168.1.x)';
  }

  return `Connect from any device on the network using: ${networkInfo.baseUrl}`;
}
