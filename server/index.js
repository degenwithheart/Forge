import express from 'express';
import cors from 'cors';
import os from 'os';
import { execSync } from 'child_process';

const app = express();
const PORT = 3001;

app.use(cors());

/**
 * Try to get GPU usage from system commands
 */
function getGPUUsage() {
  try {
    // NVIDIA GPUs (most common on Linux/Windows)
    if (process.platform === 'linux' || process.platform === 'win32') {
      try {
        const nvidia = execSync('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits', {
          encoding: 'utf8',
          timeout: 1000,
          stdio: 'pipe',
        }).trim();
        return parseFloat(nvidia) || 0;
      } catch {
        // nvidia-smi not available
      }
    }

    // macOS with Metal
    if (process.platform === 'darwin') {
      try {
        const metal = execSync('system_profiler SPDisplaysDataType', {
          encoding: 'utf8',
          timeout: 1000,
          stdio: 'pipe',
        });
        // Metal doesn't expose GPU usage easily, return 0
        return 0;
      } catch {
        // Not available
      }
    }

    return 0;
  } catch {
    return 0;
  }
}

/**
 * Get real system metrics (CPU, RAM, GPU)
 */
app.get('/api/system', (req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  // Calculate average CPU load
  const loadAvg = os.loadavg();
  const cpuCount = cpus.length;
  const cpuUsagePercent = Math.min(100, (loadAvg[0] / cpuCount) * 100);

  res.json({
    timestamp: Date.now(),
    cpu: {
      usage: Math.round(cpuUsagePercent * 10) / 10,
      cores: cpuCount,
      model: cpus[0]?.model || 'Unknown',
    },
    memory: {
      used: Math.round(usedMem / (1024 * 1024)), // MB
      total: Math.round(totalMem / (1024 * 1024)), // MB
      usagePercent: Math.round((usedMem / totalMem) * 100),
    },
    gpu: {
      usage: getGPUUsage(),
      available: true,
    },
    uptime: os.uptime(),
  });
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`📊 Telemetry server running at http://localhost:${PORT}`);
  console.log(`   GET http://localhost:${PORT}/api/system`);
  console.log(`   Metrics: CPU, Memory, GPU (if nvidia-smi available)`);
});

