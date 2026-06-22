"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
} from "lightweight-charts";

interface TradingChartProps {
  symbol: string;
  data?: CandlestickData<Time>[];
  height?: number;
  className?: string;
}

export function TradingChart({
  symbol,
  data = [],
  height = 380,
  className = "",
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [chartReady, setChartReady] = useState(false);

  const initChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const container = chartContainerRef.current;
    const containerHeight = container.clientWidth < 640 ? 250 : height;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(99, 102, 241, 0.3)",
          width: 1,
          style: 2,
        },
        horzLine: {
          color: "rgba(99, 102, 241, 0.3)",
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: containerHeight,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00e676",
      downColor: "#ff1744",
      borderUpColor: "#00e676",
      borderDownColor: "#ff1744",
      wickUpColor: "#00e676",
      wickDownColor: "#ff1744",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    setChartReady(true);

    if (data.length > 0) {
      candlestickSeries.setData(data);
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const w = chartContainerRef.current.clientWidth;
        const h = w < 640 ? 250 : height;
        chartRef.current.applyOptions({ width: w, height: h });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      setChartReady(false);
    };
  }, [data, height]);

  useEffect(() => {
    const cleanup = initChart();
    return cleanup;
  }, [initChart]);

  useEffect(() => {
    if (seriesRef.current && data.length > 0 && chartReady) {
      seriesRef.current.setData(data);
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data, chartReady]);

  return (
    <div className={`relative ${className}`}>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
