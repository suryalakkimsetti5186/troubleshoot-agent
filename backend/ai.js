// ai.js - AI Decision Engine for Dynamic Fix Generation
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const GEMINI_API_KEY = 'AIzaSyDbtiMBTGeYqzlRE7INw13E4dEp5GcAB4Y';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

class AIEngine {
    constructor() {
        this.isProcessing = false;
    }

    // Analyze issue and determine fix strategy
    async analyzeAndDecide(issue, metrics, context) {
        console.log(`🧠 AI Analyzing issue: ${issue.issue_type}`);
        
        const prompt = `
You are an expert system administrator. Analyze this system issue and provide a fix strategy.

ISSUE: ${issue.issue_type}
SEVERITY: ${issue.severity}
DETAILS: ${issue.details}
ROOT CAUSE: ${issue.root_cause}
CATEGORY: ${issue.category}

CURRENT METRICS:
- CPU Usage: ${metrics?.cpu_usage || 'N/A'}%
- CPU Temperature: ${metrics?.cpu_temp || 'N/A'}°C
- RAM Usage: ${metrics?.ram_usage || 'N/A'}%
- Disk Usage: ${metrics?.disk_usage || 'N/A'}%

CONTEXT: ${JSON.stringify(context)}

Based on the issue category:

If SOFTWARE ISSUE:
1. Identify specific action needed (restart service, kill process, clean temp files, optimize code)
2. Provide exact commands to execute
3. Explain how to verify the fix worked

If HARDWARE ISSUE:
1. Do NOT attempt automatic fixes
2. Generate a report for management
3. Provide recommendations for human action

Respond in JSON format:
{
    "action": "restart_service/kill_process/clean_disk/optimize_code/report_hardware",
    "target": "specific service or process name",
    "command": "exact command to execute",
    "verification": "how to verify fix worked",
    "message": "human readable response"
}
`;
        try {
            const result = await model.generateContent(prompt);
            const response = result.response.text();
            
            // Parse JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return this.getFallbackDecision(issue);
        } catch (error) {
            console.error('AI Error:', error);
            return this.getFallbackDecision(issue);
        }
    }

    // Generate code fix for software issues
    async generateCodeFix(issue, codeContext) {
        console.log(`🤖 AI Generating code fix for: ${issue.issue_type}`);
        
        const prompt = `
You are an expert developer. Fix the following code issue.

ISSUE: ${issue.issue_type}
DETAILS: ${issue.details}

CODE CONTEXT: ${codeContext || 'No specific code context provided'}

Generate a fix that:
1. Identifies the problematic code pattern
2. Provides the corrected code
3. Explains the fix

Respond with JSON:
{
    "problematic_code": "the problematic code snippet",
    "fixed_code": "the corrected code",
    "explanation": "what was wrong and how it was fixed"
}
`;
        try {
            const result = await model.generateContent(prompt);
            const response = result.response.text();
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return null;
        } catch (error) {
            console.error('AI Code Fix Error:', error);
            return null;
        }
    }

    // Generate hardware report
    async generateHardwareReport(issue, metrics) {
        const report = {
            issue: issue.issue_type,
            severity: issue.severity,
            metrics: {
                cpu_temp: metrics?.cpu_temp,
                cpu_usage: metrics?.cpu_usage,
                ram_usage: metrics?.ram_usage,
                disk_usage: metrics?.disk_usage
            },
            recommendation: '',
            timestamp: new Date().toISOString()
        };
        
        if (issue.issue_type === 'HIGH_CPU_TEMP') {
            report.recommendation = 'Clean cooling fans, check thermal paste, improve ventilation, or replace cooling system.';
        } else if (issue.issue_type === 'LOW_DISK') {
            report.recommendation = 'Delete temporary files, uninstall unused applications, or add additional storage.';
        } else {
            report.recommendation = 'Hardware issue detected. Please contact IT support for physical inspection.';
        }
        
        return report;
    }

    // Fallback decision when AI fails
    getFallbackDecision(issue) {
        const decisions = {
            'HIGH_CPU': {
                action: 'kill_process',
                target: 'high_cpu_process',
                command: 'taskkill /F /IM high_cpu_process.exe',
                verification: 'Check CPU usage decreased',
                message: 'Attempting to terminate high CPU process'
            },
            'HIGH_RAM': {
                action: 'restart_service',
                target: 'memory_intensive_service',
                command: 'net stop service && net start service',
                verification: 'Check RAM usage decreased',
                message: 'Attempting to restart memory-intensive service'
            },
            'LOW_DISK': {
                action: 'clean_disk',
                target: 'temporary_files',
                command: 'cleanmgr /sagerun:1',
                verification: 'Check disk space increased',
                message: 'Attempting to clean temporary files'
            },
            'HIGH_CPU_TEMP': {
                action: 'report_hardware',
                target: 'cpu_cooling',
                command: null,
                verification: null,
                message: 'HARDWARE ISSUE: CPU overheating. Report generated.'
            }
        };
        
        return decisions[issue.issue_type] || {
            action: 'report',
            target: 'unknown',
            command: null,
            verification: null,
            message: `Issue detected: ${issue.issue_type}. Manual intervention may be required.`
        };
    }
}

module.exports = new AIEngine();