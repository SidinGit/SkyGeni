import type { SummaryData, DriversData, RiskFactorsData, RecommendationsData, RevenueTrendItem } from '../types';

const API_BASE = `${import.meta.env.VITE_API_BASE}/api/v1`;

export const fetchSummary = async (): Promise<SummaryData> => {
    const res = await fetch(`${API_BASE}/summary`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
};

export const fetchRevenueTrend = async (): Promise<RevenueTrendItem[]> => {
    const res = await fetch(`${API_BASE}/trend`);
    if (!res.ok) throw new Error('Failed to fetch revenue trend');
    return res.json();
};

export const fetchDrivers = async (): Promise<DriversData> => {
    const res = await fetch(`${API_BASE}/drivers`);
    if (!res.ok) throw new Error('Failed to fetch drivers');
    return res.json();
};

export const fetchRiskFactors = async (): Promise<RiskFactorsData> => {
    const res = await fetch(`${API_BASE}/risk-factors`);
    if (!res.ok) throw new Error('Failed to fetch risk factors');
    return res.json();
};

export const fetchRecommendations = async (): Promise<RecommendationsData> => {
    const res = await fetch(`${API_BASE}/recommendations`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
};
