import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface ServerInfo {
  uptime: number;
  cpuUsage: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  networkSpeed?: {
    download: number;
    upload: number;
  };
}

/**
 * Get detailed server information including CPU, memory, disk, and uptime
 */
export async function getServerInfo(): Promise<ServerInfo> {
  try {
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();
    const cpuUsagePercent = (cpuUsage.user + cpuUsage.system) / 1000000 * 100;

    // Get memory info
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;

    // Get disk info
    let diskUsage = {
      used: 0,
      total: 0,
      percentage: 0,
    };

    try {
      const { stdout } = await execPromise('df -B1 / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      const total = parseInt(parts[1], 10);
      const used = parseInt(parts[2], 10);
      diskUsage = {
        used,
        total,
        percentage: (used / total) * 100,
      };
    } catch (err) {
      console.error('Error getting disk usage:', err);
    }

    return {
      uptime,
      cpuUsage: cpuUsagePercent,
      memoryUsage: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      diskUsage,
    };
  } catch (error) {
    console.error('Error getting server info:', error);
    throw error;
  }
}

/**
 * Get internet speed (download and upload)
 */
export async function getInternetSpeed(): Promise<{ download: number; upload: number }> {
  try {
    // Simplified implementation - you may want to use speedtest-net or similar
    // This is a placeholder that makes a request to measure download speed
    const startTime = Date.now();
    await axios.get('https://www.google.com', {
      timeout: 5000,
    });
    const downloadSpeed = (Date.now() - startTime);

    return {
      download: downloadSpeed,
      upload: 0, // Upload speed would need actual upload test
    };
  } catch (error) {
    console.error('Error getting internet speed:', error);
    return { download: 0, upload: 0 };
  }
}

/**
 * Format uptime to readable format
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}
