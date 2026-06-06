"use client";

import { useEffect, useRef, useCallback } from "react";
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
  height = 400,
  className = "",
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const initChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
        fontSize: 12,
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
      width: chartContainerRef.current.clientWidth,
      height,
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

    if (data.length > 0) {
      candlestickSeries.setData(data);
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [data, height]);

  useEffect(() => {
    const cleanup = initChart();
    return cleanup;
  }, [initChart]);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">{symbol}</h3>
          <span className="text-xs text-sentienx-text-dim">Candlestick</span>
        </div>
        <div className="flex items-center gap-1">
          {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
            <button
              key={tf}
              className="px-2 py-1 text-xs rounded bg-sentienx-bg border border-sentienx-border text-sentienx-text-dim hover:text-sentienx-text hover:border-sentienx-border-hover transition-colors"
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
