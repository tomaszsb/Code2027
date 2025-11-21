import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';

// WSL Port Forwarding Plugin
function wslPortForwardingPlugin(): Plugin {
  const PORT = 3000;

  function getWslIp(): string | null {
    try {
      // Get the WSL IP address from eth0 interface
      const result = execSync('hostname -I', { encoding: 'utf-8' });
      const ip = result.trim().split(' ')[0];
      if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        return ip;
      }
    } catch (e) {
      console.error('Failed to get WSL IP:', e);
    }
    return null;
  }

  function setupPortForwarding(wslIp: string): void {
    try {
      // Remove any existing port forwarding rule first
      console.log(`\n🔧 Setting up Windows port forwarding for port ${PORT}...`);

      // Delete existing rule (ignore errors if it doesn't exist)
      try {
        execSync(
          `powershell.exe -Command "Start-Process powershell -Verb RunAs -ArgumentList '-Command', 'netsh interface portproxy delete v4tov4 listenport=${PORT} listenaddress=0.0.0.0' -Wait"`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      } catch {
        // Ignore - rule might not exist
      }

      // Add new port forwarding rule
      execSync(
        `powershell.exe -Command "Start-Process powershell -Verb RunAs -ArgumentList '-Command', 'netsh interface portproxy add v4tov4 listenport=${PORT} listenaddress=0.0.0.0 connectport=${PORT} connectaddress=${wslIp}' -Wait"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );

      // Get Windows IP for display using multiple methods
      let windowsIp = 'your-windows-ip';
      try {
        // Try method 1: Get-NetIPAddress filtering for common local network ranges
        let ipResult = execSync(
          `powershell.exe -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual' } | Where-Object { $_.IPAddress -match '^(192\\.168\\.|10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.)' } | Select-Object -First 1).IPAddress"`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
        windowsIp = ipResult.trim();

        // If that didn't work, try simpler method
        if (!windowsIp || windowsIp === '') {
          ipResult = execSync(
            `powershell.exe -Command "(Test-Connection -ComputerName (hostname) -Count 1).IPV4Address.IPAddressToString"`,
            { encoding: 'utf-8', stdio: 'pipe' }
          );
          windowsIp = ipResult.trim() || 'your-windows-ip';
        }
      } catch {
        // Fallback - try to get from route print
        try {
          const ipResult = execSync(
            `powershell.exe -Command "ipconfig | Select-String 'IPv4.*192\\.168\\.' | ForEach-Object { ($_ -split ':')[1].Trim() } | Select-Object -First 1"`,
            { encoding: 'utf-8', stdio: 'pipe' }
          );
          windowsIp = ipResult.trim() || 'your-windows-ip';
        } catch {
          windowsIp = 'your-windows-ip';
        }
      }

      console.log(`✅ Port forwarding configured!`);
      console.log(`   WSL IP: ${wslIp}`);
      console.log(`   Windows IP: ${windowsIp}`);
      console.log(`\n📱 Access from your phone: http://${windowsIp}:${PORT}`);
      console.log(`   Local access: http://localhost:${PORT}\n`);
    } catch (e) {
      console.error('⚠️  Failed to set up port forwarding (requires admin):', e);
      console.log('   You may need to run the command manually as administrator.');
    }
  }

  return {
    name: 'wsl-port-forwarding',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        // Check if running in WSL
        try {
          const release = execSync('cat /proc/version', { encoding: 'utf-8' });
          if (!release.toLowerCase().includes('microsoft')) {
            return; // Not WSL, skip port forwarding
          }
        } catch {
          return; // Can't detect, skip
        }

        const wslIp = getWslIp();
        if (wslIp) {
          setupPortForwarding(wslIp);
        } else {
          console.warn('⚠️  Could not detect WSL IP address');
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), wslPortForwardingPlugin()],
  root: '.',
  server: {
    port: 3000,
    host: true, // Bind to all interfaces for network access
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimization for production builds
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          react: ['react', 'react-dom'],
          // Separate service chunks for code splitting
          services: [
            './src/services/DataService.ts',
            './src/services/StateService.ts',
            './src/services/LoggingService.ts'
          ],
          utils: [
            './src/utils/PerformanceMonitor.ts',
            './src/utils/FormatUtils.ts',
            './src/utils/NotificationUtils.ts'
          ]
        }
      }
    },
    // Optimize for performance
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for performance monitoring
        drop_debugger: true,
        pure_funcs: ['console.debug']
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    // Force optimization of large dependencies
    force: true
  }
});