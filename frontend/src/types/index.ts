// API Response Types

export interface SummaryData {
    currentQuarter: string;
    revenue: number;
    target: number;
    gapPercentage: number;
    qoqChange: number;
    status: 'ahead' | 'behind';
}

export interface RevenueTrendItem {
    month: string;
    amount: number;
}

export interface DriversData {
    pipelineSize: number;
    pipelineCount: number;
    winRate: number;
    avgDealSize: number;
    avgSalesCycleTime: number;
    closedWonCount: number;
    closedLostCount: number;
    pipelineTrend: number[];
    winRateTrend: number[];
    dealSizeTrend: number[];
    salesCycleTrend: number[];
}

export interface StaleDeal {
    dealId: string;
    accountName: string;
    repName: string;
    amount: number | null;
    stage: string;
    daysSinceCreated: number;
}

export interface UnderperformingRep {
    repId: string;
    repName: string;
    winRate: number;
    avgWinRate: number;
    gapFromAvg: number;
}

export interface LowActivityAccount {
    accountId: string;
    accountName: string;
    segment: string;
    activityCount: number;
}

export interface RiskFactorsData {
    staleDeals: StaleDeal[];
    underperformingReps: UnderperformingRep[];
    lowActivityAccounts: LowActivityAccount[];
    summary: {
        totalStaleDeals: number;
        totalUnderperformingReps: number;
        totalLowActivityAccounts: number;
    };
}

export interface Recommendation {
    id: number;
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    impact: string;
}

export interface RecommendationsData {
    recommendations: Recommendation[];
    generatedAt: string;
}
