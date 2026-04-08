// db.js - SQLite Database Operations
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'system_data.db');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(DB_PATH);
        
        this.db.serialize(() => {
            // System metrics table
            this.db.run(`CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                cpu_usage REAL,
                cpu_temp REAL,
                ram_usage REAL,
                ram_total REAL,
                ram_used REAL,
                disk_usage REAL,
                disk_free REAL,
                disk_total REAL,
                network_status TEXT
            )`);

            // Issues table
            this.db.run(`CREATE TABLE IF NOT EXISTS issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                issue_type TEXT,
                severity TEXT,
                category TEXT,
                details TEXT,
                root_cause TEXT,
                status TEXT DEFAULT 'detected',
                resolved_timestamp DATETIME
            )`);

            // Actions table
            this.db.run(`CREATE TABLE IF NOT EXISTS actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                issue_id INTEGER,
                action_type TEXT,
                command TEXT,
                status TEXT,
                result TEXT,
                FOREIGN KEY(issue_id) REFERENCES issues(id)
            )`);

            // Processes table
            this.db.run(`CREATE TABLE IF NOT EXISTS processes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                name TEXT,
                pid INTEGER,
                cpu_usage REAL,
                memory_usage REAL,
                status TEXT
            )`);

            // Hardware reports table
            this.db.run(`CREATE TABLE IF NOT EXISTS hardware_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                issue TEXT,
                severity TEXT,
                metrics TEXT,
                reported BOOLEAN DEFAULT 0
            )`);

            console.log('✅ Database initialized at:', DB_PATH);
        });
    }

    // Insert metrics
    insertMetrics(data) {
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO metrics (
                cpu_usage, cpu_temp, ram_usage, ram_total, ram_used, disk_usage, disk_free, disk_total, network_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [data.cpu_usage, data.cpu_temp, data.ram_usage, data.ram_total, data.ram_used,
                 data.disk_usage, data.disk_free, data.disk_total, data.network_status],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });
    }

    // Insert issue
    insertIssue(issue) {
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO issues (
                issue_type, severity, category, details, root_cause, status
            ) VALUES (?, ?, ?, ?, ?, ?)`,
                [issue.type, issue.severity, issue.category, issue.details, issue.root_cause, 'detected'],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
        });
    }

    // Update issue status
    updateIssueStatus(id, status, resolvedTimestamp = null) {
        return new Promise((resolve, reject) => {
            const sql = resolvedTimestamp ? 
                `UPDATE issues SET status = ?, resolved_timestamp = ? WHERE id = ?` :
                `UPDATE issues SET status = ? WHERE id = ?`;
            const params = resolvedTimestamp ? [status, resolvedTimestamp, id] : [status, id];
            
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Insert action
    insertAction(action) {
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO actions (
                issue_id, action_type, command, status, result
            ) VALUES (?, ?, ?, ?, ?)`,
                [action.issue_id, action.type, action.command, action.status, action.result],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });
    }

    // Insert hardware report
    insertHardwareReport(report) {
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO hardware_reports (
                issue, severity, metrics, reported
            ) VALUES (?, ?, ?, ?)`,
                [report.issue, report.severity, report.metrics, 0],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });
    }

    // Get recent issues
    getRecentIssues(limit = 20) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM issues ORDER BY timestamp DESC LIMIT ?`, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get unresolved issues
    getUnresolvedIssues() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM issues WHERE status = 'detected' OR status = 'fixing' ORDER BY timestamp ASC`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get latest metrics
    getLatestMetrics() {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1`, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Get actions for issue
    getActionsForIssue(issueId) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM actions WHERE issue_id = ? ORDER BY timestamp ASC`, [issueId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = new Database();