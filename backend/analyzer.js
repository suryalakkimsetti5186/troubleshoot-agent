// analyzer.js - Issue Detection and Classification Engine
const db = require('./db');
const monitor = require('./monitor');

class Analyzer {
    constructor() {
        this.issueHistory = [];
        this.isAnalyzing = false;
    }

    // Start continuous analysis
    startAnalysis(intervalMs = 60000) {
        setInterval(async () => {
            await this.analyzeSystem();
        }, intervalMs);
        
        // Run immediately
        this.analyzeSystem();
        console.log('🔬 Issue analysis engine started');
    }

    // Analyze entire system
    async analyzeSystem() {
        if (this.isAnalyzing) return;
        this.isAnalyzing = true;
        
        try {
            // Get current metrics
            const metrics = monitor.getCurrentMetrics();
            if (!metrics) {
                console.log('⚠️ No metrics available for analysis');
                this.isAnalyzing = false;
                return;
            }
            
            // Get anomalies
            const anomalies = await monitor.checkAnomalies();
            
            // Get top processes for context
            const topProcesses = metrics.top_processes || [];
            
            // Analyze each anomaly
            for (const anomaly of anomalies) {
                await this.processAnomaly(anomaly, metrics, topProcesses);
            }
            
            // Check for crashed applications
            await this.checkCrashedApps();
            
            // Check for abnormal process behavior
            await this.checkAbnormalProcesses(topProcesses);
            
        } catch (error) {
            console.error('❌ Analysis error:', error);
        }
        
        this.isAnalyzing = false;
    }

    // Process individual anomaly
    async processAnomaly(anomaly, metrics, topProcesses) {
        // Check if this issue was recently reported
        const existingIssues = await db.getUnresolvedIssues();
        const recentlyReported = existingIssues.some(issue => 
            issue.issue_type === anomaly.type && 
            new Date(issue.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
        );
        
        if (recentlyReported) {
            console.log(`⏭️ Issue ${anomaly.type} already reported recently, skipping`);
            return;
        }
        
        // Determine category (SOFTWARE or HARDWARE)
        let category = 'SOFTWARE';
        let rootCause = '';
        
        switch (anomaly.type) {
            case 'HIGH_CPU_TEMP':
                category = 'HARDWARE';
                rootCause = `CPU temperature is at ${anomaly.value}°C which exceeds safe operating limits. Possible causes: dust buildup, failing cooling fan, or poor ventilation.`;
                break;
            case 'LOW_DISK':
                category = 'SOFTWARE';
                rootCause = `Disk usage is at ${anomaly.value}%. Consider cleaning up temporary files, uninstalling unused applications, or moving files to external storage.`;
                break;
            case 'HIGH_CPU':
                category = 'SOFTWARE';
                if (topProcesses.length > 0) {
                    rootCause = `High CPU usage (${anomaly.value}%) primarily caused by: ${topProcesses[0].name} (${topProcesses[0].cpu}%).`;
                } else {
                    rootCause = `High CPU usage at ${anomaly.value}%.`;
                }
                break;
            case 'HIGH_RAM':
                category = 'SOFTWARE';
                rootCause = `High RAM usage at ${anomaly.value}%.`;
                break;
            case 'NETWORK_DOWN':
                category = 'SOFTWARE';
                rootCause = `Network connection is disconnected. Check cables, WiFi adapter, or router.`;
                break;
            default:
                rootCause = anomaly.message;
        }
        
        // Create issue record
        const issue = {
            type: anomaly.type,
            severity: anomaly.severity,
            category: category,
            details: anomaly.message,
            root_cause: rootCause
        };
        
        const issueId = await db.insertIssue(issue);
        
        console.log(`\n🚨 ISSUE DETECTED: ${anomaly.type} [${anomaly.severity}]`);
        console.log(`   Category: ${category}`);
        console.log(`   Details: ${anomaly.message}`);
        console.log(`   Issue ID: ${issueId}`);
        
        return issueId;
    }

    // Check for crashed applications
    async checkCrashedApps() {
        // This would check event logs or process list for crashed apps
        // Simplified implementation
        const processes = await monitor.getCurrentMetrics();
        if (!processes) return;
        
        // Check for common critical processes that should be running
        const criticalProcesses = ['explorer.exe', 'svchost.exe', 'winlogon.exe'];
        // This would be expanded in production
    }

    // Check for abnormal process behavior
    async checkAbnormalProcesses(topProcesses) {
        if (!topProcesses || topProcesses.length === 0) return;
        
        // Check for processes consuming excessive resources
        for (const proc of topProcesses) {
            if (proc.cpu > 80) {
                console.log(`⚠️ Process ${proc.name} consuming ${proc.cpu}% CPU`);
            }
            if (proc.memory > 2048) { // >2GB memory
                console.log(`⚠️ Process ${proc.name} consuming ${proc.memory}MB memory`);
            }
        }
    }

    // Classify issue (returns category)
    classifyIssue(issueType) {
        const hardwareIssues = ['HIGH_CPU_TEMP', 'HARDWARE_FAILURE', 'DISK_FAILURE', 'FAN_FAILURE'];
        const softwareIssues = ['HIGH_CPU', 'HIGH_RAM', 'LOW_DISK', 'APP_CRASH', 'NETWORK_DOWN'];
        
        if (hardwareIssues.includes(issueType)) return 'HARDWARE';
        if (softwareIssues.includes(issueType)) return 'SOFTWARE';
        return 'UNKNOWN';
    }

    // Get severity level
    getSeverity(metricValue, thresholds) {
        if (metricValue >= thresholds.critical) return 'CRITICAL';
        if (metricValue >= thresholds.high) return 'HIGH';
        if (metricValue >= thresholds.medium) return 'MEDIUM';
        return 'LOW';
    }
}

module.exports = new Analyzer();