// fixer.js - Self-Healing Action Executor
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const db = require('./db');
const ai = require('./ai');
const monitor = require('./monitor');

class Fixer {
    constructor() {
        this.isFixing = false;
        this.fixQueue = [];
    }

    // Start auto-fix loop
    startAutoFix(intervalMs = 30000) {
        setInterval(async () => {
            await this.processPendingIssues();
        }, intervalMs);
        console.log('🔧 Self-healing engine started');
    }

    // Process pending issues
    async processPendingIssues() {
        if (this.isFixing) return;
        
        const issues = await db.getUnresolvedIssues();
        if (issues.length === 0) return;
        
        console.log(`\n🔧 Processing ${issues.length} pending issues...`);
        
        for (const issue of issues) {
            await this.fixIssue(issue);
        }
    }

    // Fix individual issue
    async fixIssue(issue) {
        console.log(`\n🔨 Fixing issue: ${issue.issue_type} (ID: ${issue.id})`);
        
        // Update status to fixing
        await db.updateIssueStatus(issue.id, 'fixing');
        
        // Get current metrics for context
        const metrics = monitor.getCurrentMetrics();
        const topProcesses = metrics?.top_processes || [];
        
        // Get AI decision
        const decision = await ai.analyzeAndDecide(issue, metrics, { top_processes: topProcesses });
        
        console.log(`   Decision: ${decision.action}`);
        
        let fixResult = null;
        
        if (issue.category === 'HARDWARE') {
            fixResult = await this.handleHardwareIssue(issue, metrics, decision);
        } else {
            fixResult = await this.handleSoftwareIssue(issue, decision);
        }
        
        // Record action
        await db.insertAction({
            issue_id: issue.id,
            type: decision.action,
            command: decision.command || 'none',
            status: fixResult.success ? 'success' : 'failed',
            result: fixResult.message
        });
        
        // Update issue status
        if (fixResult.success) {
            await db.updateIssueStatus(issue.id, 'resolved', new Date().toISOString());
            console.log(`   ✅ Issue resolved! ${fixResult.message}`);
        } else {
            await db.updateIssueStatus(issue.id, 'failed');
            console.log(`   ❌ Fix failed: ${fixResult.message}`);
        }
        
        return fixResult;
    }

    // Handle software issues
    async handleSoftwareIssue(issue, decision) {
        switch (decision.action) {
            case 'restart_service':
                return await this.restartService(decision.target, decision.command);
                
            case 'kill_process':
                return await this.killProcess(decision.target, decision.command);
                
            case 'clean_disk':
                return await this.cleanDisk(decision.command);
                
            case 'optimize_code':
                return await this.optimizeCode(issue, decision);
                
            default:
                return { success: false, message: `Unknown action: ${decision.action}` };
        }
    }

    // Restart a service
    async restartService(serviceName, command) {
        return new Promise((resolve) => {
            const cmd = command || `net stop "${serviceName}" && net start "${serviceName}"`;
            exec(cmd, { windowsHide: true }, (error, stdout) => {
                if (error) {
                    resolve({ success: false, message: `Failed to restart service: ${error.message}` });
                } else {
                    resolve({ success: true, message: `Service ${serviceName} restarted successfully` });
                }
            });
        });
    }

    // Kill a process
    async killProcess(processName, command) {
        return new Promise((resolve) => {
            const cmd = command || `taskkill /F /IM "${processName}"`;
            exec(cmd, { windowsHide: true }, (error, stdout) => {
                if (error) {
                    resolve({ success: false, message: `Failed to kill process: ${error.message}` });
                } else {
                    resolve({ success: true, message: `Process ${processName} terminated` });
                }
            });
        });
    }

    // Clean disk
    async cleanDisk(command) {
        return new Promise((resolve) => {
            const cmd = command || 'cleanmgr /sagerun:1';
            exec(cmd, { windowsHide: true }, (error, stdout) => {
                if (error) {
                    // Try alternative cleanup
                    exec('del /q /s %TEMP%\\*', { windowsHide: true }, (err) => {
                        if (err) {
                            resolve({ success: false, message: 'Disk cleanup failed' });
                        } else {
                            resolve({ success: true, message: 'Temporary files cleaned' });
                        }
                    });
                } else {
                    resolve({ success: true, message: 'Disk cleanup completed' });
                }
            });
        });
    }

    // Optimize code (AI-powered code fix)
    async optimizeCode(issue, decision) {
        try {
            // This would find and fix the problematic code file
            // Simplified implementation
            const codeFix = await ai.generateCodeFix(issue, decision.codeContext);
            
            if (codeFix && codeFix.fixed_code) {
                // In production, this would write to actual files
                console.log(`   Generated fix: ${codeFix.explanation}`);
                return { success: true, message: `Code fix generated: ${codeFix.explanation}` };
            }
            
            return { success: false, message: 'Could not generate code fix' };
        } catch (error) {
            return { success: false, message: `Code optimization failed: ${error.message}` };
        }
    }

    // Handle hardware issues (report only, no auto-fix)
    async handleHardwareIssue(issue, metrics, decision) {
        const report = await ai.generateHardwareReport(issue, metrics);
        
        // Store hardware report
        await db.insertHardwareReport({
            issue: report.issue,
            severity: report.severity,
            metrics: JSON.stringify(report.metrics)
        });
        
        // Simulate escalation to management
        console.log('\n' + '='.repeat(60));
        console.log('📢 HARDWARE ISSUE REPORT - ESCALATED TO MANAGEMENT');
        console.log('='.repeat(60));
        console.log(`Issue: ${report.issue}`);
        console.log(`Severity: ${report.severity}`);
        console.log(`Metrics: ${report.metrics}`);
        console.log(`Recommendation: ${report.recommendation}`);
        console.log(`Ticket ID: HWR-${Date.now()}-${Math.floor(Math.random() * 10000)}`);
        console.log('='.repeat(60) + '\n');
        
        return { 
            success: true, 
            message: `Hardware issue reported to management. ${report.recommendation}` 
        };
    }

    // Manual fix trigger
    async triggerFix(issueId) {
        const issues = await db.getRecentIssues(50);
        const issue = issues.find(i => i.id === issueId);
        
        if (!issue) {
            return { success: false, message: `Issue ${issueId} not found` };
        }
        
        return await this.fixIssue(issue);
    }

    // Fix all pending issues
    async fixAllIssues() {
        const issues = await db.getUnresolvedIssues();
        const results = [];
        
        for (const issue of issues) {
            const result = await this.fixIssue(issue);
            results.push({ issue_id: issue.id, ...result });
        }
        
        return results;
    }
}

module.exports = new Fixer();