
export interface TelemetryMetrics {
    composite_node_key: string;
    timestamp: string;
    megawatts_delivered: number;
}

export interface DashboardStats {
    totalIPPCount: number;
    peakGenerationMW: number;
    totalEnergyDeliveredMWH: number;
    recentReadings: TelemetryMetrics[];
}
