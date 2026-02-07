import { Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { RecommendationsData } from '../types';

interface Props {
    data: RecommendationsData | null;
    loading: boolean;
}

export default function RecommendationsCard({ data, loading }: Props) {
    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Recommended Actions
                    </Typography>
                    <Typography>Loading...</Typography>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    // Take top 3 recommendations
    const topRecommendations = data.recommendations.slice(0, 3);

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Recommended Actions
                </Typography>

                <List dense>
                    {topRecommendations.map((rec) => (
                        <ListItem key={rec.id} disablePadding sx={{ py: 1, alignItems: 'flex-start' }}>
                            <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                                <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#f97316' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={rec.title}
                                primaryTypographyProps={{ variant: 'body2' }}
                            />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
}
