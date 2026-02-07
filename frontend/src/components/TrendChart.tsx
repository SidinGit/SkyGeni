import { useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import * as d3 from 'd3';
import type { RevenueTrendItem } from '../types';

interface Props {
    data: RevenueTrendItem[] | null;
    loading?: boolean;
}

export default function TrendChart({ data, loading }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = 600 - margin.left - margin.right;
        const height = 250 - margin.top - margin.bottom;

        const g = svg
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3
            .scaleBand()
            .domain(data.map((d) => d.month))
            .range([0, width])
            .padding(0.3);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.amount) || 50000])
            .nice()
            .range([height, 0]);

        // X Axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('font-size', '12px');

        // Y Axis
        g.append('g')
            .call(
                d3.axisLeft(y)
                    .ticks(5)
                    .tickFormat((d) => `${Number(d) / 1000}K`)
            )
            .selectAll('text')
            .style('font-size', '12px');

        // Bars
        g.selectAll('.bar')
            .data(data)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', (d) => x(d.month) || 0)
            .attr('y', (d) => y(d.amount))
            .attr('width', x.bandwidth())
            .attr('height', (d) => height - y(d.amount))
            .attr('fill', '#3b82f6')
            .attr('rx', 4);

        // Line
        const line = d3
            .line<(typeof data)[0]>()
            .x((d) => (x(d.month) || 0) + x.bandwidth() / 2)
            .y((d) => y(d.amount))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#f97316')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Line points
        g.selectAll('.dot')
            .data(data)
            .join('circle')
            .attr('class', 'dot')
            .attr('cx', (d) => (x(d.month) || 0) + x.bandwidth() / 2)
            .attr('cy', (d) => y(d.amount))
            .attr('r', 5)
            .attr('fill', '#f97316')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
    }, [data]);

    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography>Loading Chart...</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Revenue Trend <Typography component="span" color="text.secondary">(Last 6 Months)</Typography>
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                    <svg ref={svgRef}></svg>
                </Box>
            </CardContent>
        </Card>
    );
}
