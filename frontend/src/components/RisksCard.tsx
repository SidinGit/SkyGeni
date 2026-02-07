import { Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { RiskFactorsData } from '../types';

interface Props {
    data: RiskFactorsData | null;
    loading: boolean;
}

export default function RisksCard({ data, loading }: Props) {
    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Top Risk Factors
                    </Typography>
                    <Typography>Loading...</Typography>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const riskItems = [
        {
            text: `${data.summary.totalStaleDeals} Enterprise deals stuck over 30 days`,
            color: '#f97316',
        },
        {
            text: data.underperformingReps[0]
                ? `Rep ${data.underperformingReps[0].repName} – Win Rate: ${data.underperformingReps[0].winRate.toFixed(0)}%`
                : 'No underperforming reps',
            color: '#f97316',
        },
        {
            text: `${data.summary.totalLowActivityAccounts} Accounts with no recent activity`,
            color: '#f97316',
        },
    ];

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Top Risk Factors
                </Typography>

                <List dense>
                    {riskItems.map((item, index) => (
                        <ListItem key={index} disablePadding sx={{ py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <FiberManualRecordIcon sx={{ fontSize: 12, color: item.color }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{ variant: 'body2' }}
                            />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
}
