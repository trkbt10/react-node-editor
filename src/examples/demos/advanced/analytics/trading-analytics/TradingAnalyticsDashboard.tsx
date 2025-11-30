/**
 * @file Trading analytics dashboard example
 * Demonstrates a trading analytics dashboard with strategy cards and performance metrics
 */
import * as React from "react";
import { NodeEditor, type GridLayoutConfig, type LayerDefinition } from "../../../../../index";
import type { NodeEditorData } from "../../../../../types/core";
import { NodeCanvas } from "../../../../../components/canvas/NodeCanvas";
import { InspectorPanel } from "../../../../../components/inspector/InspectorPanel";
import { StatusBar } from "../../../../../components/layout/StatusBar";
import { Minimap } from "../../../../../components/layers/Minimap";
import { createTradingNodeDefinitions } from "./tradingNodeDefinitions";

const initialData: NodeEditorData = {
  nodes: {
    // Left side: Trading strategies and signal sources
    "momentum-strategy": {
      id: "momentum-strategy",
      type: "algo-strategy",
      position: { x: 80, y: 80 },
      size: { width: 220, height: 140 },
      data: {
        title: "Momentum trading strategy",
        trader: "Algo (Quant)",
        signals: 8,
        winRate: 73,
        status: "active",
      },
    },
    "market-signals": {
      id: "market-signals",
      type: "signal-source",
      position: { x: 80, y: 260 },
      size: { width: 220, height: 120 },
      data: {
        title: "Market sentiment signals",
        trader: "ML Model",
        signals: 12,
        winRate: 65,
        status: "testing",
      },
    },
    "risk-alerts": {
      id: "risk-alerts",
      type: "signal-source",
      position: { x: 80, y: 420 },
      size: { width: 220, height: 110 },
      data: {
        title: "Risk management alerts",
        trader: "Risk Engine",
        signals: 5,
        winRate: 100,
        status: "deployed",
      },
    },
    "arbitrage-bot": {
      id: "arbitrage-bot",
      type: "algo-strategy",
      position: { x: 80, y: 570 },
      size: { width: 220, height: 140 },
      data: {
        title: "Cross-exchange arbitrage",
        trader: "Bot Alpha",
        signals: 15,
        winRate: 82,
        status: "testing",
      },
    },
    "technical-indicators": {
      id: "technical-indicators",
      type: "signal-source",
      position: { x: 80, y: 750 },
      size: { width: 220, height: 120 },
      data: {
        title: "Technical indicator signals",
        trader: "TA Engine",
        signals: 24,
        winRate: 58,
        status: "deployed",
      },
    },

    // Center and right: Trading metrics
    "trade-volume": {
      id: "trade-volume",
      type: "trading-volume",
      position: { x: 400, y: 80 },
      size: { width: 320, height: 180 },
      data: {
        title: "Daily trade volume",
        metricType: "Volume",
        past1day: { value: 2450, change: 1.2 },
        past1week: { value: 15830, change: 3.5 },
        past1month: { value: 68240, change: 12.8 },
        trendDirection: "up",
      },
    },
    "execution-rate": {
      id: "execution-rate",
      type: "trading-volume",
      position: { x: 400, y: 300 },
      size: { width: 320, height: 180 },
      data: {
        title: "Order execution rate",
        metricType: "Rate",
        past1day: { value: "98.5%", change: 0.3 },
        past1week: { value: "97.8%", change: -0.5 },
        past1month: { value: "98.2%", change: 1.2 },
        trendDirection: "up",
      },
    },
    "sharpe-ratio": {
      id: "sharpe-ratio",
      type: "performance-metric",
      position: { x: 400, y: 520 },
      size: { width: 320, height: 240 },
      data: {
        title: "Sharpe ratio",
        metricType: "Risk-adjusted return",
        target: { value: 2.5, label: "target" },
        past1day: { value: 2.12, change: -5.2 },
        past1week: { value: 2.35, change: 2.8 },
        past1month: { value: 2.18, change: -8.4 },
        variance: 0.156,
      },
    },
    "win-rate": {
      id: "win-rate",
      type: "trading-volume",
      position: { x: 400, y: 800 },
      size: { width: 320, height: 180 },
      data: {
        title: "Overall win rate",
        metricType: "Success rate",
        past1day: { value: "72.3%", change: 2.1 },
        past1week: { value: "68.5%", change: -1.2 },
        past1month: { value: "71.8%", change: 4.5 },
        trendDirection: "up",
      },
    },
    "portfolio-return": {
      id: "portfolio-return",
      type: "trading-volume",
      position: { x: 760, y: 360 },
      size: { width: 340, height: 180 },
      data: {
        title: "Portfolio total return",
        metricType: "Cumulative return",
        past1day: { value: "$24.5K", change: 0.8 },
        past1week: { value: "$168.2K", change: 5.2 },
        past1month: { value: "$732.8K", change: 18.3 },
        trendDirection: "up",
      },
    },

    // Right side: Portfolio metrics
    "aum": {
      id: "aum",
      type: "portfolio-metric",
      position: { x: 1180, y: 220 },
      size: { width: 280, height: 160 },
      data: {
        title: "Assets Under Management",
        metricType: "Total AUM",
        past1day: { value: 12500000, change: 2.3 },
        past1week: { value: 12200000, change: 0.5 },
        past1month: { value: 11800000, change: 6.8 },
        symbol: "$",
      },
    },
    "drawdown": {
      id: "drawdown",
      type: "portfolio-metric",
      position: { x: 1180, y: 420 },
      size: { width: 280, height: 160 },
      data: {
        title: "Maximum drawdown",
        metricType: "Risk metric",
        past1day: { value: "-2.1%", change: null },
        past1week: { value: "-4.5%", change: -1.2 },
        past1month: { value: "-8.3%", change: 2.1 },
        trendDirection: "up",
      },
    },
    "profit-factor": {
      id: "profit-factor",
      type: "portfolio-metric",
      position: { x: 1180, y: 620 },
      size: { width: 280, height: 160 },
      data: {
        title: "Profit factor",
        metricType: "Ratio",
        past1day: { value: 1.85, change: 3.2 },
        past1week: { value: 1.92, change: 5.5 },
        past1month: { value: 2.08, change: 12.3 },
        trendDirection: "up",
      },
    },
  },
  connections: {
    // Strategy to metrics connections
    "momentum-to-volume": {
      id: "momentum-to-volume",
      fromNodeId: "momentum-strategy",
      fromPortId: "output",
      toNodeId: "trade-volume",
      toPortId: "input",
      data: { correlation: 0.924 },
    },
    "momentum-to-execution": {
      id: "momentum-to-execution",
      fromNodeId: "momentum-strategy",
      fromPortId: "output",
      toNodeId: "execution-rate",
      toPortId: "input",
      data: { correlation: 0.856 },
    },
    "market-to-execution": {
      id: "market-to-execution",
      fromNodeId: "market-signals",
      fromPortId: "output",
      toNodeId: "execution-rate",
      toPortId: "input",
      data: { correlation: 0.712 },
    },
    "risk-to-execution": {
      id: "risk-to-execution",
      fromNodeId: "risk-alerts",
      fromPortId: "output",
      toNodeId: "execution-rate",
      toPortId: "input",
      data: { correlation: -0.234 },
    },
    "arbitrage-to-sharpe": {
      id: "arbitrage-to-sharpe",
      fromNodeId: "arbitrage-bot",
      fromPortId: "output",
      toNodeId: "sharpe-ratio",
      toPortId: "input",
      data: { correlation: 0.789 },
    },
    "technical-to-winrate": {
      id: "technical-to-winrate",
      fromNodeId: "technical-indicators",
      fromPortId: "output",
      toNodeId: "win-rate",
      toPortId: "input",
      data: { correlation: 0.645 },
    },

    // Metric flow connections
    "volume-to-return": {
      id: "volume-to-return",
      fromNodeId: "trade-volume",
      fromPortId: "output",
      toNodeId: "portfolio-return",
      toPortId: "input",
      data: { correlation: 0.892 },
    },
    "execution-to-return": {
      id: "execution-to-return",
      fromNodeId: "execution-rate",
      fromPortId: "output",
      toNodeId: "portfolio-return",
      toPortId: "input",
      data: { correlation: 0.934 },
    },
    "sharpe-to-return": {
      id: "sharpe-to-return",
      fromNodeId: "sharpe-ratio",
      fromPortId: "output",
      toNodeId: "portfolio-return",
      toPortId: "input",
      data: { correlation: 0.401 },
    },
    "winrate-to-return": {
      id: "winrate-to-return",
      fromNodeId: "win-rate",
      fromPortId: "output",
      toNodeId: "portfolio-return",
      toPortId: "input",
      data: { correlation: 0.978 },
    },
    "return-to-aum": {
      id: "return-to-aum",
      fromNodeId: "portfolio-return",
      fromPortId: "output",
      toNodeId: "aum",
      toPortId: "input",
      data: { correlation: 0.867 },
    },
    "return-to-drawdown": {
      id: "return-to-drawdown",
      fromNodeId: "portfolio-return",
      fromPortId: "output",
      toNodeId: "drawdown",
      toPortId: "input",
      data: { correlation: -0.523 },
    },
    "return-to-profit": {
      id: "return-to-profit",
      fromNodeId: "portfolio-return",
      fromPortId: "output",
      toNodeId: "profit-factor",
      toPortId: "input",
      data: { correlation: 0.945 },
    },
  },
};

export const TradingAnalyticsDashboard: React.FC = () => {
  const nodeDefinitions = React.useMemo(() => createTradingNodeDefinitions(), []);

  const gridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      areas: [
        ["canvas", "inspector"],
        ["statusbar", "statusbar"],
      ],
      rows: [{ size: "1fr" }, { size: "auto" }],
      columns: [{ size: "1fr" }, { size: "320px", resizable: true, minSize: 220, maxSize: 520 }],
      gap: "0",
    }),
    [],
  );

  const gridLayers = React.useMemo<LayerDefinition[]>(
    () => [
      {
        id: "canvas",
        component: <NodeCanvas />,
        gridArea: "canvas",
        zIndex: 0,
      },
      {
        id: "inspector",
        component: <InspectorPanel />,
        gridArea: "inspector",
        zIndex: 1,
      },
      {
        id: "statusbar",
        component: <StatusBar />,
        gridArea: "statusbar",
        zIndex: 1,
      },
      {
        id: "minimap",
        component: <Minimap width={200} height={140} />,
        positionMode: "absolute",
        position: { bottom: 10, right: 10 },
        width: 200,
        height: 140,
        zIndex: 100,
        traggable: true,
      },
    ],
    [],
  );

  return (
    <NodeEditor
      initialData={initialData}
      nodeDefinitions={nodeDefinitions}
      includeDefaultDefinitions={false}
      gridConfig={gridConfig}
      gridLayers={gridLayers}
    />
  );
};

export default TradingAnalyticsDashboard;
