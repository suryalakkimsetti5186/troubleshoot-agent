// monitor.js - System Monitoring Module
const si = require('systeminformation');
const db = require('./db');

class Monitor {
    constructor() {
        this.isMonitoring = false;
        this.intervalId = null;
        this.metricsHistory = [];
        this.callbacks = [];
    }

    // Start continuous monitoring
    startMonitoring(intervalMs = 30000) {
        if (this.isMonitoring) {
            console.log('⚠️ Monitoring already running');
            return;
        }

        this.isMonitoring = true;
        console.log(`🔍 Starting system monitoring every ${intervalMs / 1000} seconds...`);
        
        this.intervalId = setInterval(async () => {
            await this.collectMetrics();
        }, intervalMs);
        
        // Run immediately
        this.collectMetrics();
    }

    // Stop monitoring
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isMonitoring = false;
        console.log('⏹️ Monitoring stopped');
    }

    // Collect all system metrics
    async collectMetrics() {
        try {
            const metrics = await this.getAllMetrics();
            
            // Store in database
            await db.insertMetrics(metrics);
            
            // Store in memory history
            this.metricsHistory.unshift(metrics);
            if (this.metricsHistory.length > 100) {
                this.metricsHistory.pop();
            }
            
            // Notify callbacks
            this.callbacks.forEach(cb => cb(metrics));
            
            console.log(`📊 Metrics collected - CPU: ${metrics.cpu_usage}% | RAM: ${metrics.ram_usage}% | Disk: ${metrics.disk_usage}%`);
            
            return metrics;
        } catch (error) {
            console.error('❌ Metrics collection error:', error);
            return null;
        }
    }

    // Get all system metrics
    async getAllMetrics() {
        // CPU
        const cpu = await si.cpu();
        const currentLoad = await si.currentLoad();
        const cpuTemp = await si.cpuTemperature();
        
        // Memory
        const mem = await si.mem();
        
        // Disk
        const fsSize = await si.fsSize();
        const mainDisk = fsSize[0] || {};
        
        // Network
        const network = await si.networkInterfaces();
        const activeNetwork = network.find(n => n.operstate === 'up');
        
        // Processes
        const processes = await si.processes();
        const topProcesses = processes.list
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 10);
        
        // Store processes
        await this.storeProcesses(topProcesses);
        
        return {
            cpu_usage: parseFloat(currentLoad.currentLoad.toFixed(1)),
            cpu_temp: cpuTemp.main ? parseFloat(cpuTemp.main.toFixed(1)) : 0,
            ram_usage: parseFloat(((mem.active / mem.total) * 100).toFixed(1)),
            ram_total: (mem.total / 1073741824).toFixed(2),
            ram_used: (mem.active / 1073741824).toFixed(2),
            disk_usage: mainDisk.size ? parseFloat(((mainDisk.used / mainDisk.size) * 100).toFixed(1)) : 0,
            disk_free: mainDisk.available ? (mainDisk.available / 1073741824).toFixed(2) : '0',
            disk_total: mainDisk.size ? (mainDisk.size / 1073741824).toFixed(2) : '0',
            network_status: activeNetwork ? 'connected' : 'disconnected',
            top_processes: topProcesses,
            timestamp: new Date().toISOString()
        };
    }

    // Store processes in database
    async storeProcesses(processes) {
        for (const proc of processes) {
            db.db.run(`INSERT INTO processes (name, pid, cpu_usage, memory_usage, status) VALUES (?, ?, ?, ?, ?)`,
                [proc.name, proc.pid, proc.cpu.toFixed(1), (proc.mem / 1048576).toFixed(1), 'running'],
                (err) => { if (err) console.error('Process insert error:', err); }
            );
        }
    }

    // Get current metrics
    getCurrentMetrics() {
        return this.metricsHistory[0] || null;
    }

    // Get metrics history
    getMetricsHistory(limit = 10) {
        return this.metricsHistory.slice(0, limit);
    }

    // Register callback for metrics updates
    onMetrics(callback) {
        this.callbacks.push(callback);
    }

    // Check for anomalies
    async checkAnomalies() {
        const metrics = await this.getCurrentMetrics();
        if (!metrics) return [];
        
        const anomalies = [];
        
        // High CPU
        if (metrics.cpu_usage > 80) {
            anomalies.push({
                type: 'HIGH_CPU',
                severity: 'HIGH',
                value: metrics.cpu_usage,
                threshold: 80,
                message: `CPU usage is at ${metrics.cpu_usage}%`
            });
        } else if (metrics.cpu_usage > 60) {
            anomalies.push({
                type: 'HIGH_CPU',
                severity: 'MEDIUM',
                value: metrics.cpu_usage,
                threshold: 60,
                message: `CPU usage is at ${metrics.cpu_usage}%`
            });
        }
        
        // High CPU Temperature
        if (metrics.cpu_temp > 80) {
            anomalies.push({
                type: 'HIGH_CPU_TEMP',
                severity: 'CRITICAL',
                value: metrics.cpu_temp,
                threshold: 80,
                message: `CPU temperature is at ${metrics.cpu_temp}°C`
            });
        } else if (metrics.cpu_temp > 70) {
            anomalies.push({
                type: 'HIGH_CPU_TEMP',
                severity: 'HIGH',
                value: metrics.cpu_temp,
                threshold: 70,
                message: `CPU temperature is at ${metrics.cpu_temp}°C`
            });
        }
        
        // High RAM usage
        if (metrics.ram_usage > 85) {
            anomalies.push({
                type: 'HIGH_RAM',
                severity: 'HIGH',
                value: metrics.ram_usage,
                threshold: 85,
                message: `RAM usage is at ${metrics.ram_usage}%`
            });
        } else if (metrics.ram_usage > 70) {
            anomalies.push({
                type: 'HIGH_RAM',
                severity: 'MEDIUM',
                value: metrics.ram_usage,
                threshold: 70,
                message: `RAM usage is at ${metrics.ram_usage}%`
            });
        }
        
        // Low disk space
        if (metrics.disk_usage > 90) {
            anomalies.push({
                type: 'LOW_DISK',
                severity: 'CRITICAL',
                value: metrics.disk_usage,
                threshold: 90,
                message: `Disk usage is at ${metrics.disk_usage}%`
            });
        } else if (metrics.disk_usage > 75) {
            anomalies.push({
                type: 'LOW_DISK',
                severity: 'MEDIUM',
                value: metrics.disk_usage,
                threshold: 75,
                message: `Disk usage is at ${metrics.disk_usage}%`
            });
        }
        
        // Network disconnected
        if (metrics.network_status === 'disconnected') {
            anomalies.push({
                type: 'NETWORK_DOWN',
                severity: 'HIGH',
                value: 0,
                threshold: 0,
                message: 'Network connection is down'
            });
        }
        
        return anomalies;
    }
}

module.exports = new Monitor();