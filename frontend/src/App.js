// App.js - Complete with Issues & Healing Log Display
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [metrics, setMetrics] = useState(null);
    const [issues, setIssues] = useState([]);
    const [healingLog, setHealingLog] = useState([]);
    const [input, setInput] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Fetch system status
    const fetchStatus = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/status');
            const data = await res.json();
            if (data.success) setMetrics(data.metrics);
        } catch (error) {
            console.error('Status fetch error:', error);
        }
    };

    // Fetch issues
    const fetchIssues = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/issues');
            const data = await res.json();
            if (data.success) setIssues(data.issues || []);
        } catch (error) {
            console.error('Issues fetch error:', error);
        }
    };

    // Fetch healing log
    const fetchHealingLog = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/healing-log');
            const data = await res.json();
            if (data.success) setHealingLog(data.log || []);
        } catch (error) {
            console.error('Healing log fetch error:', error);
        }
    };

    // Send command
    const sendCommand = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setResponse('');
        
        try {
            const res = await fetch('http://localhost:5001/api/voice-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: input })
            });
            const data = await res.json();
            setResponse(data.message);
            fetchIssues();
            fetchHealingLog();
        } catch (error) {
            setResponse('❌ Error connecting to agent');
        }
        
        setLoading(false);
        setInput('');
    };

    // Run full system heal
    const runFullHeal = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/fix-all', { method: 'POST' });
            const data = await res.json();
            setResponse(data.message);
            fetchIssues();
            fetchHealingLog();
        } catch (error) {
            setResponse('❌ Error running full heal');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStatus();
        fetchIssues();
        fetchHealingLog();
        
        const interval = setInterval(() => {
            fetchStatus();
            fetchIssues();
            fetchHealingLog();
        }, 10000);
        
        return () => clearInterval(interval);
    }, []);

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'CRITICAL': return '#e74c3c';
            case 'HIGH': return '#e67e22';
            case 'MEDIUM': return '#f39c12';
            default: return '#27ae60';
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'detected': return '#e74c3c';
            case 'resolved': return '#27ae60';
            case 'auto_fix_failed': return '#e67e22';
            default: return '#95a5a6';
        }
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <span className="logo-icon">🤖</span>
                        <span className="logo-text">Self-Healing Agent</span>
                    </div>
                    <div className="status-badge">
                        <span className="status-dot healthy"></span>
                        <span>System Active</span>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="nav-tabs">
                <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                    📊 Dashboard
                </button>
                <button className={`tab ${activeTab === 'commands' ? 'active' : ''}`} onClick={() => setActiveTab('commands')}>
                    🎤 Command Center
                </button>
                <button className={`tab ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>
                    🚨 Issues ({issues.filter(i => i.status === 'detected').length})
                </button>
                <button className={`tab ${activeTab === 'healing' ? 'active' : ''}`} onClick={() => setActiveTab('healing')}>
                    🔧 Healing Log ({healingLog.length})
                </button>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="dashboard">
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <div className="metric-icon">💻</div>
                                <div className="metric-value">{metrics?.cpu_usage || '--'}%</div>
                                <div className="metric-label">CPU Usage</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-icon">🌡️</div>
                                <div className="metric-value">{metrics?.cpu_temp || '--'}°C</div>
                                <div className="metric-label">CPU Temperature</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-icon">💾</div>
                                <div className="metric-value">{metrics?.ram_usage || '--'}%</div>
                                <div className="metric-label">RAM Usage</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-icon">💿</div>
                                <div className="metric-value">{metrics?.disk_usage || '--'}%</div>
                                <div className="metric-label">Disk Usage</div>
                            </div>
                        </div>

                        <div className="info-grid">
                            <div className="info-card">
                                <h3>📊 System Details</h3>
                                <div className="info-row"><span>RAM Total:</span><strong>{metrics?.ram_total || '--'} GB</strong></div>
                                <div className="info-row"><span>RAM Used:</span><strong>{metrics?.ram_used || '--'} GB</strong></div>
                                <div className="info-row"><span>Disk Free:</span><strong>{metrics?.disk_free || '--'} GB</strong></div>
                                <div className="info-row"><span>Network:</span><strong className="success">{metrics?.network_status || 'connected'}</strong></div>
                            </div>
                            <div className="info-card">
                                <h3>🤖 Agent Status</h3>
                                <div className="info-row"><span>Monitoring:</span><strong className="success">Active (30s interval)</strong></div>
                                <div className="info-row"><span>Auto-Healing:</span><strong className="success">Enabled</strong></div>
                                <div className="info-row"><span>Issues Found:</span><strong>{issues.filter(i => i.status === 'detected').length}</strong></div>
                                <div className="info-row"><span>Issues Resolved:</span><strong>{issues.filter(i => i.status === 'resolved').length}</strong></div>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button className="btn-primary" onClick={runFullHeal} disabled={loading}>🩺 Run Full System Heal</button>
                            <button className="btn-secondary" onClick={() => { fetchIssues(); fetchHealingLog(); }}>⟳ Refresh</button>
                        </div>
                        
                        {response && (
                            <div className="response-box">
                                <div className="response-icon">🤖</div>
                                <div className="response-text">{response}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Command Center Tab */}
                {activeTab === 'commands' && (
                    <div className="command-center">
                        <div className="command-panel">
                            <h2>🎤 Command Center</h2>
                            <p className="command-desc">Type commands to control your system</p>
                            
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendCommand()}
                                    placeholder='Try: "open chrome", "check CPU", "lock screen", "show issues"'
                                    className="command-input"
                                    disabled={loading}
                                />
                                <button onClick={sendCommand} disabled={loading} className="send-btn">
                                    {loading ? '⏳' : '➤'}
                                </button>
                            </div>
                            
                            {response && (
                                <div className="response-box">
                                    <div className="response-icon">🤖</div>
                                    <div className="response-text">{response}</div>
                                </div>
                            )}
                            
                            <div className="quick-commands">
                                <h3>📋 Quick Commands</h3>
                                <div className="commands-grid">
                                    <button onClick={() => setInput('open chrome')} className="quick-cmd">🌐 open chrome</button>
                                    <button onClick={() => setInput('open notepad')} className="quick-cmd">📝 open notepad</button>
                                    <button onClick={() => setInput('check CPU')} className="quick-cmd">📊 check CPU</button>
                                    <button onClick={() => setInput('check memory')} className="quick-cmd">💾 check memory</button>
                                    <button onClick={() => setInput('lock screen')} className="quick-cmd">🔒 lock screen</button>
                                    <button onClick={() => setInput('show issues')} className="quick-cmd">🚨 show issues</button>
                                    <button onClick={() => setInput('shutdown')} className="quick-cmd">🖥️ shutdown</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Issues Tab */}
                {activeTab === 'issues' && (
                    <div className="issues-container">
                        <h2>🚨 Detected Issues</h2>
                        {issues.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">✅</div>
                                <p>No issues detected. System is healthy!</p>
                            </div>
                        ) : (
                            <div className="issues-list">
                                {issues.map(issue => (
                                    <div key={issue.id} className="issue-card">
                                        <div className="issue-header">
                                            <span className="severity-badge" style={{ background: getSeverityColor(issue.severity) }}>
                                                {issue.severity}
                                            </span>
                                            <span className={`issue-status ${issue.status}`}>
                                                {issue.status === 'resolved' ? '✅ Resolved' : issue.status === 'detected' ? '⚠️ Active' : '❌ Failed'}
                                            </span>
                                        </div>
                                        <div className="issue-title">{issue.issue_type?.replace(/_/g, ' ')}</div>
                                        <div className="issue-details">{issue.details}</div>
                                        <div className="issue-recommendation">
                                            <strong>🔧 Recommendation:</strong> {issue.recommendation}
                                        </div>
                                        <div className="issue-time">
                                            {new Date(issue.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Healing Log Tab */}
                {activeTab === 'healing' && (
                    <div className="healing-container">
                        <h2>🔧 Healing Action Log</h2>
                        {healingLog.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <p>No healing actions recorded yet.</p>
                            </div>
                        ) : (
                            <div className="healing-list">
                                {healingLog.map(log => (
                                    <div key={log.id} className={`healing-card ${log.status}`}>
                                        <div className="healing-header">
                                            <span className="healing-icon">{log.status === 'success' ? '✅' : '❌'}</span>
                                            <span className="healing-type">{log.action_taken}</span>
                                            <span className="healing-time">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="healing-command">
                                            <strong>Command:</strong> <code>{log.command}</code>
                                        </div>
                                        <div className="healing-result">
                                            <strong>Result:</strong> {log.result}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <footer className="footer">
                <p>🤖 Auto-detects CPU, RAM, Disk, Temperature issues every 30 seconds | Self-Healing Enabled</p>
            </footer>
        </div>
    );
}

export default App;