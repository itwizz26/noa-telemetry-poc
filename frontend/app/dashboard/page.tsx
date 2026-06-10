"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Activity, ShieldCheck, RefreshCw, AlertTriangle, CloudLightning, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { DashboardStats } from '@/types/telemetry';

// Temporal window configuration types
type TimeWindow = 'ALL' | '7D' | '3D' | '24H';

export default function TelemetryDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastSynced, setLastSynced] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState<boolean>(false);

    // 🎛️ Advanced Local UI State Matrix
    const [selectedNode, setSelectedNode] = useState<string>('ALL');
    const [timeWindow, setTimeWindow] = useState<TimeWindow>('ALL');
    const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 25;

    // Fetch the complete telemetry pool from the un-capped Django backend
    const fetchDashboardData = useCallback(async (isBackground: boolean = false) => {
        try {
            if (!isBackground) setLoading(true);
            setIsPolling(true);
            setError(null);
            
            let res: Response;
            try {
                res = await fetch('http://127.0.0.1:8000/api/v1/analytics/');
            } catch (networkError) {
                throw new Error("Network connection refused. Verify that the Django server is running on port 8000.");
            }
            
            if (!res.ok) {
                throw new Error(`Gateway Error: Server returned status code ${res.status}`);
            }
            
            const data: DashboardStats = await res.json();
            setStats(data);
            setLastSynced(new Date().toLocaleTimeString());
        } catch (err: any) {
            setError(err.message || "Failed to establish communication with the telemetry endpoint.");
        } finally {
            setLoading(false);
            setIsPolling(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(() => {
            fetchDashboardData(true);
        }, 30000);
        
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    // Reset pagination cleanly whenever any structural filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedNode, timeWindow, sortDirection]);

    // ⚙️ Extract unique node keys for the filter dropdown reactively
    const uniqueNodes = useMemo(() => {
        if (!stats?.recentReadings) return [];
        const nodes = stats.recentReadings.map(r => r.composite_node_key);
        return ['ALL', ...Array.from(new Set(nodes))];
    }, [stats?.recentReadings]);

    // 📊 Centralized High-Performance Data Pipeline
    const sortedAndFilteredReadings = useMemo(() => {
        if (!stats?.recentReadings) return [];

        let processed = [...stats.recentReadings];

        // Phase 1: Apply Temporal Window Filter
        if (timeWindow !== 'ALL') {
            const now = new Date().getTime();
            let windowMs = 24 * 60 * 60 * 1000; // Default 24H

            if (timeWindow === '7D') windowMs = 7 * 24 * 60 * 60 * 1000;
            if (timeWindow === '3D') windowMs = 3 * 24 * 60 * 60 * 1000;

            processed = processed.filter(reading => {
                const readingTime = new Date(reading.timestamp).getTime();
                return (now - readingTime) <= windowMs;
            });
        }

        // Phase 2: Apply Node Filtering
        if (selectedNode !== 'ALL') {
            processed = processed.filter(r => r.composite_node_key === selectedNode);
        }

        // Phase 3: Apply Chronological Sorting (Oldest vs Newest First)
        return processed.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return sortDirection === 'ASC' ? timeA - timeB : timeB - timeA;
        });
    }, [stats?.recentReadings, selectedNode, timeWindow, sortDirection]);

    // ✂️ Client Pagination Slicer
    const totalPages = Math.ceil(sortedAndFilteredReadings.length / ITEMS_PER_PAGE) || 1;
    
    const paginatedReadings = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return sortedAndFilteredReadings.slice(startIndex, endIndex);
    }, [sortedAndFilteredReadings, currentPage]);

    // 1. Core Network Drop / Server Offline View Frame
    if (error && !stats) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-200">
                <CloudLightning className="mb-4 h-12 w-12 text-rose-500 animate-pulse" />
                <h3 className="text-xl font-semibold text-slate-50">Telemetry Link Offline</h3>
                <p className="mt-2 max-w-md text-sm text-slate-400 bg-slate-900 border border-slate-800 p-3 rounded text-rose-300 font-mono text-xs">
                    {error}
                </p>
                <button 
                    onClick={() => fetchDashboardData(false)}
                    className="mt-6 flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-sm hover:bg-slate-800 transition text-emerald-400"
                >
                    <RefreshCw className="h-4 w-4" /> Try Reconnecting
                </button>
            </div>
        );
    }

    // 2. Main Loading State Frame
    if (loading && !stats) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-200">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
                    <span className="text-sm font-medium tracking-wide text-slate-400">Compiling Full Telemetry Ledger...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-950 p-8 text-slate-100">
            
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-50">NOA Telemetry Operations Center</h1>
                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                        <span>Real-time half-hour energy aggregation pipeline</span>
                        {lastSynced && (
                            <>
                                <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                                <span className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                                    Last Sync: {lastSynced}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                
                <button 
                    onClick={() => fetchDashboardData(false)}
                    disabled={isPolling}
                    className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin text-emerald-500' : ''}`} /> 
                    {isPolling ? 'Polling Data...' : 'Refresh System'}
                </button>
            </div>

            {/* Connection Dropped Warning Banner */}
            {error && stats && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-400">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span><strong>Connection dropped:</strong> Telemetry endpoint unreachable. Displaying frozen cache state.</span>
                </div>
            )}

            {/* KPI Cards Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">Total Energy Monitored</span>
                        <Zap className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold">
                        {stats?.totalEnergyDeliveredMWH !== undefined ? stats.totalEnergyDeliveredMWH.toFixed(2) : '0.00'} MWh
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">Peak System Demand</span>
                        <Activity className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold">
                        {stats?.peakGenerationMW !== undefined ? stats.peakGenerationMW.toFixed(2) : '0.00'} MW
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">Active Facilities</span>
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold">{stats?.totalIPPCount ?? 0} Nodes</div>
                </div>
            </div>

            {/* Analytics Graph Block */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
                
                {/* Dynamic Controls Bar */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100">Aggregated Grid Generation Curve (MW)</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Showing items {Math.min(sortedAndFilteredReadings.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(sortedAndFilteredReadings.length, currentPage * ITEMS_PER_PAGE)} of {sortedAndFilteredReadings.length} tracked records
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* 📅 New Time Window Filter Dropdown */}
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-slate-500 mr-1">Window:</span>
                            <select 
                                value={timeWindow}
                                onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
                                className="bg-transparent text-slate-200 outline-none cursor-pointer font-sans"
                            >
                                <option value="ALL" className="bg-slate-900 text-slate-200">All History</option>
                                <option value="7D" className="bg-slate-900 text-slate-200">Last 7 Days</option>
                                <option value="3D" className="bg-slate-900 text-slate-200">Last 3 Days</option>
                                <option value="24H" className="bg-slate-900 text-slate-200">Last 24 Hours</option>
                            </select>
                        </div>

                        {/* Node Filter Selector */}
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                            <Filter className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-slate-500 mr-1">Node:</span>
                            <select 
                                value={selectedNode}
                                onChange={(e) => setSelectedNode(e.target.value)}
                                className="bg-transparent text-slate-200 outline-none cursor-pointer font-mono"
                            >
                                {uniqueNodes.map(node => (
                                    <option key={node} value={node} className="bg-slate-900 text-slate-200">
                                        {node}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Timeline Direction Switcher */}
                        <button
                            onClick={() => setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                            className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 transition"
                            title="Toggle Time Direction"
                        >
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                            <span>Timeline: <strong>{sortDirection === 'ASC' ? 'Oldest First' : 'Newest First'}</strong></span>
                        </button>
                    </div>
                </div>

                {/* Graph View Frame */}
                <div className="h-70 w-full mb-6">
                    <div className="h-[300px] w-full"> 
                        {paginatedReadings.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={paginatedReadings} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorMw" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                        dataKey="timestamp" 
                                        stroke="#64748b" 
                                        tickFormatter={(str) => {
                                            const d = new Date(str);
                                            return isNaN(d.getTime()) ? str : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        }} 
                                    />
                                    <YAxis stroke="#64748b" unit=" MW" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                        labelFormatter={(label) => {
                                            const d = new Date(label);
                                            return isNaN(d.getTime()) ? label : d.toLocaleString();
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="megawatts_delivered" 
                                        stroke="#10b981" 
                                        fillOpacity={1} 
                                        fill="url(#colorMw)" 
                                        name="Output" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950 text-slate-500 text-sm">
                                No active telemetry segments fit the current date/node criteria selection.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination Toolbar Controls */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-sm text-slate-400">
                    <div className="text-xs">
                        Page <span className="text-slate-200 font-semibold">{currentPage}</span> of <span className="text-slate-200 font-semibold">{totalPages}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> Previous
                        </button>
                        
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:cursor-not-allowed"
                        >
                            Next <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
