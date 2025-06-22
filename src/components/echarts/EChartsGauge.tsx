
"use client";

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { GaugeChart as EChartsGaugeSeries, type GaugeChartSeriesOption } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TitleComponent, type TitleComponentOption, TooltipComponent, type TooltipComponentOption } from 'echarts/components';

echarts.use([EChartsGaugeSeries, TitleComponent, TooltipComponent, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  GaugeChartSeriesOption | TitleComponentOption | TooltipComponentOption
>;

interface EChartsGaugeProps {
  value: number; // The actual value to display in the detail, and to base the progress on (capped)
  max: number; // The conceptual maximum value, used for context if needed, but visual gauge max is fixed
  titleText?: string; 
  style?: React.CSSProperties;
  className?: string;
}

const EChartsGauge: React.FC<EChartsGaugeProps> = ({
  value,
  max, // This prop is kept for potential contextual use
  style,
  className,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const isMountedRef = useRef(false);

  const gaugeMaxValue = 120; // Visual maximum of the gauge
  const progressColor = '#58D9F9'; // Fixed progress color

  useEffect(() => {
    isMountedRef.current = true;
    let chartInstance: echarts.ECharts | null = null;

    if (chartRef.current) {
      chartInstance = echarts.init(chartRef.current);
      chartInstanceRef.current = chartInstance;

      const option: EChartsOption = {
        series: [
          {
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: gaugeMaxValue, // Visual maximum of the gauge
            splitNumber: 6, // For divisions every 20 units (120 / 6 = 20)
            itemStyle: {
              color: progressColor, 
              shadowColor: 'rgba(0,138,255,0.45)', 
              shadowBlur: 10, 
              shadowOffsetX: 2, 
              shadowOffsetY: 2, 
            },
            progress: {
              show: true,
              roundCap: true,
              width: 8, 
            },
            pointer: {
              icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
              length: '75%',
              width: 16,
              offsetCenter: [0, '5%'],
              itemStyle: { 
                color: progressColor, 
              }
            },
            axisLine: {
              roundCap: true,
              lineStyle: {
                width: 8,
                color: [[1, '#f3f4f6']] 
              },
            },
            axisTick: {
              splitNumber: 2, 
              lineStyle: {
                width: 2,
                color: '#999', 
              },
            },
            splitLine: {
              length: 12, 
              lineStyle: {
                width: 3,
                color: '#999', 
              },
            },
            axisLabel: {
              distance: 25, 
              color: '#999', 
              fontSize: 12, 
              formatter: (val: number) => val.toFixed(0), 
            },
            title: { 
              show: false, 
            },
            detail: {
              backgroundColor: '#fff',
              borderColor: '#999',
              borderWidth: 1, 
              width: '60%',
              lineHeight: 35, 
              height: 35,    
              borderRadius: 8,
              offsetCenter: [0, '35%'],
              valueAnimation: true,
              formatter: () => { // Formatter uses the original 'value' prop from component scope
                return `{value|${value.toFixed(0)}}{unit|m}`;
              },
              rich: {
                value: {
                  fontSize: 30, 
                  fontWeight: 'bolder',
                  color: '#777', 
                },
                unit: {
                  fontSize: 12, 
                  color: '#999', 
                  padding: [0, 0, -10, 4], 
                },
              },
            },
            data: [
              {
                value: Math.min(value, gaugeMaxValue), // Value for drawing capped at gaugeMaxValue
              },
            ],
          },
        ],
      };
      chartInstance.setOption(option);
    }

    const handleResize = () => {
      if (isMountedRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      chartInstance?.dispose();
      chartInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial setup only

  // Effect to update chart when data props change
  useEffect(() => {
    if (chartInstanceRef.current && isMountedRef.current) {
      chartInstanceRef.current.setOption({
        series: [
          {
            data: [{ value: Math.min(value, gaugeMaxValue) }], // Capped value for drawing
            detail: { 
              formatter: () => { // Ensure formatter uses the updated 'value' from props
                return `{value|${value.toFixed(0)}}{unit|m}`;
              },
            },
          },
        ],
      });
    }
  }, [value]); // Only re-run if 'value' (actual meters) changes.

  return <div ref={chartRef} style={{ width: '100%', height: '280px', ...style }} className={className} />;
};

export default EChartsGauge;
