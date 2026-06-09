"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Activity, ShieldCheck, RefreshCw } from 'lucide-react';
import { DashboardStats } from '@/types/telemetry';

export default function TelemetryDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Polls the Django API for aggregate analytics
    const fetchDashboardData = async () => {
    try {
        setLoading(true);
        
        // Updated to point directly to your accurate URL pattern mapping
        const res = await fetch('http://127.0.0.1:8000/api/v1/analytics/');
        
        if (!res.ok) {
            throw new Error(`Server returned status level: ${res.status}`);
            }
            
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error("Failed to pull metrics timeline:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Poll every 30 seconds to simulate a live grid environment
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-200">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-950 p-8 text-slate-100">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-50">NOA Telemetry Operations Center</h1>
                    <p className="text-sm text-slate-400">Real-time half-hour energy aggregation pipeline</p>
                </div>
                <button 
                    onClick={fetchDashboardData}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium border border-slate-800 hover:bg-slate-800 transition"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh System
                </button>
            </div>

            {/* KPI Cards Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">Total Energy Monitored</span>
                        <Zap className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold">{stats?.totalEnergyDeliveredMWH?.toFixed(2) || '0.00'} MWh</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">Peak System Demand</span>
                        <Activity className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold">{stats?.peakGenerationMW?.toFixed(2) || '0.00'} MW</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">Active Facilities</span>
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold">{stats?.totalIPPCount || 0} Nodes</div>
                </div>
            </div>

            {/* Analytics Graph Block */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
                <h2 className="mb-6 text-lg font-semibold text-slate-100">Aggregated Grid Generation Curve (MW)</h2>
                <div className="h-70 w-full">
                    <div className="h-[300px] w-full"> 
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.recentReadings || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                    tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                />
                                <YAxis stroke="#64748b" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                />
                                <Area type="monotone" dataKey="megawatts_delivered" stroke="#10b981" fillOpacity={1} fill="url(#colorMw)" name="Megawatts" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
