import { useState, useEffect } from 'react';
import { Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Header from './components/Header';
import SummaryBanner from './components/SummaryBanner';
import DriversCard from './components/DriversCard';
import RisksCard from './components/RisksCard';
import RecommendationsCard from './components/RecommendationsCard';
import TrendChart from './components/TrendChart';
import type { SummaryData, DriversData, RiskFactorsData, RecommendationsData, RevenueTrendItem } from './types';
import { fetchSummary, fetchDrivers, fetchRiskFactors, fetchRecommendations, fetchRevenueTrend } from './api';

const theme = createTheme({
  palette: {
    background: {
      default: '#f1f5f9',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [drivers, setDrivers] = useState<DriversData | null>(null);
  const [risks, setRisks] = useState<RiskFactorsData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [trend, setTrend] = useState<RevenueTrendItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryData, driversData, risksData, recsData, trendData] = await Promise.all([
          fetchSummary(),
          fetchDrivers(),
          fetchRiskFactors(),
          fetchRecommendations(),
          fetchRevenueTrend(),
        ]);
        setSummary(summaryData);
        setDrivers(driversData);
        setRisks(risksData);
        setRecommendations(recsData);
        setTrend(trendData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}>
        <Header />
        <SummaryBanner data={summary} loading={loading} />

        {/* Main dashboard grid */}
        <Box sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 2.5,
          p: 2.5,
          overflow: 'hidden'
        }}>
          {/* Left column: Revenue Drivers (full height) */}
          <DriversCard data={drivers} loading={loading} />

          {/* Right section: nested grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            gap: 2.5,
            overflow: 'hidden'
          }}>
            {/* Top row: Risk Factors + Recommendations */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
              <RisksCard data={risks} loading={loading} />
              <RecommendationsCard data={recommendations} loading={loading} />
            </Box>

            {/* Bottom: Trend Chart */}
            <TrendChart data={trend} loading={loading} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
