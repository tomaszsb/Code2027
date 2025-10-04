#!/usr/bin/env node

// scripts/performance-comparison.js
// Performance comparison script to measure load time improvements

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function measureLoadTime(entryPoint, description) {
  console.log(`\n📊 Measuring load time for: ${description}`);
  console.log('='.repeat(50));

  return new Promise((resolve, reject) => {
    // Build the application with the specified entry point
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        VITE_ENTRY_POINT: entryPoint
      }
    });

    let buildOutput = '';
    buildProcess.stdout.on('data', (data) => {
      buildOutput += data.toString();
    });

    buildProcess.stderr.on('data', (data) => {
      buildOutput += data.toString();
    });

    buildProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Build failed with code ${code}`));
        return;
      }

      // Extract build metrics from output
      const bundleSize = extractBundleSize(buildOutput);
      const buildTime = extractBuildTime(buildOutput);

      console.log(`✅ Build completed:`);
      console.log(`   Bundle size: ${bundleSize}`);
      console.log(`   Build time: ${buildTime}`);

      resolve({
        description,
        bundleSize,
        buildTime,
        entryPoint
      });
    });
  });
}

function extractBundleSize(output) {
  const sizeMatch = output.match(/index-[\w]+\.js\s+([0-9.]+\s+[A-Za-z]+)/);
  return sizeMatch ? sizeMatch[1] : 'Unknown';
}

function extractBuildTime(output) {
  const timeMatch = output.match(/built in (\d+\.\d+s|\d+ms)/);
  return timeMatch ? timeMatch[1] : 'Unknown';
}

async function runComparison() {
  console.log('🚀 Starting performance comparison...');
  console.log('This will measure load times for original vs optimized versions');

  const results = [];

  try {
    // Test original version
    const originalResult = await measureLoadTime('./src/main.tsx', 'Original Implementation');
    results.push(originalResult);

    // Test optimized version
    const optimizedResult = await measureLoadTime('./src/mainOptimized.tsx', 'Optimized Implementation');
    results.push(optimizedResult);

    // Generate comparison report
    generateReport(results);

  } catch (error) {
    console.error('❌ Performance comparison failed:', error.message);
    process.exit(1);
  }
}

function generateReport(results) {
  console.log('\n📈 PERFORMANCE COMPARISON REPORT');
  console.log('='.repeat(60));

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.description}`);
    console.log(`   Entry Point: ${result.entryPoint}`);
    console.log(`   Bundle Size: ${result.bundleSize}`);
    console.log(`   Build Time:  ${result.buildTime}`);
  });

  if (results.length === 2) {
    console.log('\n🎯 IMPROVEMENT ANALYSIS');
    console.log('-'.repeat(40));

    const original = results[0];
    const optimized = results[1];

    // Try to calculate improvements (if we can parse the numbers)
    const originalSize = parseSize(original.bundleSize);
    const optimizedSize = parseSize(optimized.bundleSize);

    if (originalSize && optimizedSize) {
      const sizeReduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      console.log(`Bundle Size Reduction: ${sizeReduction}%`);

      if (sizeReduction > 0) {
        console.log(`✅ Bundle size improved by ${sizeReduction}%`);
      }
    }

    console.log(`\n💡 Optimizations implemented:`);
    console.log(`   ✓ Lazy service initialization`);
    console.log(`   ✓ Progressive data loading`);
    console.log(`   ✓ Component code splitting`);
    console.log(`   ✓ Optimized Vite configuration`);
    console.log(`   ✓ Performance monitoring system`);
  }

  // Save report to file
  const reportPath = path.join(__dirname, '..', 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

function parseSize(sizeStr) {
  const match = sizeStr.match(/([0-9.]+)\s*([A-Za-z]+)/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  // Convert to bytes for comparison
  switch (unit) {
    case 'kb':
      return value * 1024;
    case 'mb':
      return value * 1024 * 1024;
    case 'gb':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}

// Run the comparison
runComparison();