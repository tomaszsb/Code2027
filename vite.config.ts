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

      // Get Windows IP for display - use simple ipconfig parsing
      let windowsIp = 'your-windows-ip';
      try {
        // Use cmd.exe with ipconfig for more reliable output
        const ipResult = execSync(
          `cmd.exe /c "ipconfig | findstr /C:\\"IPv4 Address\\" | findstr 192.168"`,
          { encoding: 'utf-8' }
        );

        // Parse output like: "   IPv4 Address. . . . . . . . . . . : 192.168.1.100"
        const match = ipResult.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match && match[1]) {
          windowsIp = match[1];
        } else {
          // Fallback to PowerShell with better error handling
          try {
            const psResult = execSync(
              `powershell.exe -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -like '192.168.*' | Select-Object -First 1 -ExpandProperty IPAddress"`,
              { encoding: 'utf-8' }
            ).trim();
            if (psResult && /^\d+\.\d+\.\d+\.\d+$/.test(psResult)) {
              windowsIp = psResult;
            }
          } catch (e) {
            console.warn('   Could not auto-detect Windows IP:', (e as Error).message);
          }
        }
      } catch (e) {
        console.warn('   Could not auto-detect Windows IP:', (e as Error).message);
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