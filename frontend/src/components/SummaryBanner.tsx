import { Box, Typography } from '@mui/material';
import type { SummaryData } from '../types';

interface Props {
    data: SummaryData | null;
    loading: boolean;
}

const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
};

export default function SummaryBanner({ data, loading }: Props) {
    if (loading) {
        return (
            <Box sx={{ bgcolor: '#1e3a5f', py: 2, px: 4 }}>
                <Typography color="white" align="center">Loading...</Typography>
            </Box>
        );
    }

    if (!data) return null;

    const gapColor = data.status === 'ahead' ? '#4ade80' : '#f87171';

    // Calculate gap text: "- 29% to Goal" or "+ 12% to Goal"
    const gapValue = `${data.status === 'ahead' ? '+' : '-'} ${Math.abs(data.gapPercentage).toFixed(0)}%`;

    return (
        <Box
            sx={{
                bgcolor: '#1e3a5f',
                py: 2,
                px: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 3,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
        >
            {/* QTD Revenue Section */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 500, fontSize: '1.5rem' }}>
                    QTD Revenue:
                </Typography>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, fontSize: '1.75rem' }}>
                    {formatCurrency(data.revenue)}
                </Typography>
            </Box>

            {/* Divider */}
            <Box
                sx={{
                    height: 32,
                    width: '1px',
                    minWidth: '1px',
                    bgcolor: 'rgba(255,255,255,0.3)',
                    mx: 2,
                    flexShrink: 0
                }}
            />

            {/* Target Section */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 400, fontSize: '1.1rem' }}>
                    Target:
                </Typography>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.25rem' }}>
                    {formatCurrency(data.target)}
                </Typography>
            </Box>

            {/* Divider */}
            <Box
                sx={{
                    height: 32,
                    width: '1px',
                    minWidth: '1px',
                    bgcolor: 'rgba(255,255,255,0.3)',
                    mx: 2,
                    flexShrink: 0
                }}
            />

            {/* Goal % Section */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography
                    variant="h6"
                    sx={{
                        color: gapColor,
                        fontWeight: 600,
                        fontSize: '1.1rem'
                    }}
                >
                    {gapValue}
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: 'white',
                        fontWeight: 400,
                        fontSize: '1rem'
                    }}
                >
                    to Goal
                </Typography>
            </Box>
        </Box>
    );
}
