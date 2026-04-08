// App.js - Complete with Issues & Healing Log
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
    const [autoDetect, setAutoDetect] = useState(true);

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
            const res = await fetch('http://localhost:5001/api