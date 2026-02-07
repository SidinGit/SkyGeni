import { useRef, useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Divider } from '@mui/material';
import * as d3 from 'd3';
import type { DriversData } from '../types';

interface Props {
    data: DriversData | null;
    loading: boolean;
}

// Hook for responsive chart width
const useChartDimensions = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!ref.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                setWidth(entries[0].contentRect.width);
            }
        });
        resizeObserver.observe(ref.current);
        return () => resizeObserver.disconnect();
    }, []);

    return { ref, width };
};

// --- D3 CHART COMPONENTS ---

const CHART_HEIGHT = 40;

const SparkArea = ({ color, dataPoints }: { color: string; dataPoints: number[] }) => {
    const { ref, width } = useChartDimensions();

    if (!width) return <Box ref={ref} sx={{ height: CHART_HEIGHT, width: '100%' }} />;

    const xScale = d3.scaleLinear().domain([0, dataPoints.length - 1]).range([0, width]);
    const yScale = d3.scaleLinear().domain([Math.min(...dataPoints), Math.max(...dataPoints)]).range([CHART_HEIGHT - 2, 2]); // Padding

    const areaGenerator = d3.area<number>()
        .x((_, i) => xScale(i))
        .y0(CHART_HEIGHT)
        .y1(d => yScale(d))
        .curve(d3.curveMonotoneX);

    const lineGenerator = d3.line<number>()
        .x((_, i) => xScale(i))
        .y(d => yScale(d))
        .curve(d3.curveMonotoneX);

    return (
        <Box ref={ref} sx={{ height: CHART_HEIGHT, width: '100%' }}>
            <svg width={width} height={CHART_HEIGHT} style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </linearGradient>
                </defs>
                <path d={areaGenerator(dataPoints) || ''} fill={`url(#gradient-${color.replace('#', '')})`} />
                <path d={lineGenerator(dataPoints) || ''} fill="none" stroke={color} strokeWidth="2" />
            </svg>
        </Box>
    );
};

const SparkBar = ({ color, dataPoints }: { color: string; dataPoints: number[] }) => {
    const { ref, width } = useChartDimensions();

    if (!width) return <Box ref={ref} sx={{ height: CHART_HEIGHT, width: '100%' }} />;

    const maxValue = Math.max(...dataPoints);
    const yScale = d3.scaleLinear().domain([0, maxValue]).range([0, CHART_HEIGHT]);

    // Calculate width with gaps
    const totalBars = dataPoints.length;
    const barWidth = (width / totalBars) * 0.7; // 70% width
    const gap = (width / totalBars) * 0.3; // 30% gap

    return (
        <Box ref={ref} sx={{ height: CHART_HEIGHT, width: '100%' }}>
            <svg width={width} height={CHART_HEIGHT}>
                {dataPoints.map((d, i) => (
                    <rect
                        key={i}
                        x={i * (width / totalBars) + gap / 2}
                        y={CHART_HEIGHT - yScale(d)}
                        width={barWidth}
                        height={yScale(d)}
                        fill={color}
                        rx={2}
                        opacity={0.8}
                    />
                ))}
            </svg>
        </Box>
    );
};

const SparkLine = ({ color, dataPoints }: { color: string; dataPoints: number[] }) => {
    const { ref, width } = useChartDimensions();

    if (!width) return <Box ref={ref} sx={{ height: CHART_HEIGHT, width: '100%' }} />;

    const xScale = d3.scaleLinear().domain([0, dataPoints.length - 1]).range([0, width]);
    const yScale = d3.scaleLinear().domain([Math.min(...dataPoints), Math.max(...dataPoints)]).range([CHART_HEIGHT - 5, 5]);

    const lineGenerator = d3.line<number>()
        .x((_, i) => xScale(i))
        .y(d => yScale(d))
        .curve(d3.curveMonotoneX);

    // Calculate last point for the dot
    const lastX = xScale(dataPoints.length - 1);
    const lastY = yScale(dataPoints[dataPoints.length - 1]);

    return (
        <Box ref={ref} sx={{ height: CHART_HEIGHT, width: '100%' }}>
            <svg width={width} height={CHART_HEIGHT} style={{ overflow: 'visible' }}>
                <defs>
                    <filter id="shadow-orange" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={color} floodOpacity="0.3" />
                    </filter>
                    <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Area under line */}
                <path
                    d={d3.area<number>()
                        .x((_, i) => xScale(i))
                        .y0(CHART_HEIGHT)
                        .y1(d => yScale(d))
                        .curve(d3.curveMonotoneX)(dataPoints) || ''}
                    fill={`url(#gradient-${color.replace('#', '')})`}
                />

                {/* The Line */}
                <path
                    d={lineGenerator(dataPoints) || ''}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    filter="url(#shadow-orange)"
                />

                {/* End Dot */}
                <circle cx={lastX} cy={lastY} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />
            </svg>
        </Box>
    );
};

// Utils
const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
};

// Dummy Data Generators for "Micro-charts"
// Using fixed data to ensure consistency across renders but detailed enough for "premium" look
// Data trends provided by API to ensure consistency

interface DriverItemProps {
    label: string;
    value: string;
    change: string;
    changeColor: string;
    chart: React.ReactNode;
}

function DriverItem({ label, value, change, changeColor, chart }: DriverItemProps) {
    return (
        <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.95rem' }}>
                    {label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: changeColor, fontWeight: 700, fontSize: '0.9rem' }}>
                        {change}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ mt: 0.5 }}>
                {chart}
            </Box>
        </Box>
    );
}

export default function DriversCard({ data, loading }: Props) {
    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent><Typography>Loading...</Typography></CardContent>
            </Card>
        );
    }
    if (!data) return null;

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, fontSize: '1.1rem' }}>
                    Revenue Drivers
                </Typography>

                <DriverItem
                    label="Pipeline Value"
                    value={formatCurrency(data.pipelineSize)}
                    change="+12%"
                    changeColor="#22c55e"
                    chart={<SparkArea color="#3b82f6" dataPoints={data.pipelineTrend || []} />}
                />
                <Divider sx={{ my: 0.5, borderColor: '#f1f5f9' }} />

                <DriverItem
                    label="Win Rate"
                    value={`${data.winRate.toFixed(0)}%`}
                    change="-4%"
                    changeColor="#ef4444"
                    chart={<SparkBar color="#3b82f6" dataPoints={data.winRateTrend || []} />}
                />
                <Divider sx={{ my: 0.5, borderColor: '#f1f5f9' }} />

                <DriverItem
                    label="Avg Deal Size"
                    value={formatCurrency(data.avgDealSize)}
                    change="+3%"
                    changeColor="#22c55e"
                    chart={<SparkArea color="#3b82f6" dataPoints={data.dealSizeTrend || []} />}
                />
                <Divider sx={{ my: 0.5, borderColor: '#f1f5f9' }} />

                <DriverItem
                    label="Sales Cycle"
                    value={`${data.avgSalesCycleTime} Days`}
                    change="+9 Days"
                    changeColor="#22c55e"
                    chart={<SparkLine color="#f97316" dataPoints={data.salesCycleTrend || []} />}
                />
            </CardContent>
        </Card>
    );
}
