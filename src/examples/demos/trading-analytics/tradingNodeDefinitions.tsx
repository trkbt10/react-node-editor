/**
 * @file Node definitions for trading analytics dashboard
 */
import * as React from "react";
import {
  createNodeDefinition,
  toUntypedDefinition,
  type NodeDefinition,
  type NodeRenderProps,
} from "../../../types/NodeDefinition";
import { NodeResizer } from "../../../components/node/NodeResizer";
import { renderTradingConnection, renderTradingPort } from "./tradingRenderers";
import classes from "./TradingAnalyticsDashboard.module.css";

// Strategy/Signal card data types
type StrategyCardData = {
  title: string;
  trader: string;
  signals: number;
  winRate: number;
  status: "active" | "testing" | "paused" | "deployed";
};

// Trading metric data types
type MetricPeriodValue = {
  value: number | string;
  change: number | null;
};

type TradingMetricData = {
  title: string;
  metricType: string;
  past1day: MetricPeriodValue;
  past1week: MetricPeriodValue;
  past1month: MetricPeriodValue;
  trendDirection: "up" | "down";
  symbol?: string;
};

type PerformanceMetricData = {
  title: string;
  metricType: string;
  past1day: MetricPeriodValue;
  past1week: MetricPeriodValue;
  past1month: MetricPeriodValue;
  target?: { value: number; label: string };
  variance?: number;
};

type PortfolioMetricData = {
  title: string;
  metricType: string;
  past1day: MetricPeriodValue;
  past1week: MetricPeriodValue;
  past1month: MetricPeriodValue;
  symbol?: string;
};

// Helper to format values
const formatValue = (value: number | string): string => {
  if (typeof value === "string") {
    return value;
  }
  return value.toLocaleString();
};

// Helper to format percentage
const formatPercentage = (change: number | null): string => {
  if (change === null) {
    return "No change";
  }
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
};

// Strategy Card Renderer
const StrategyCardRenderer = ({ node }: NodeRenderProps<StrategyCardData>) => {
  const statusColors = {
    active: "#10b981",
    testing: "#f59e0b",
    paused: "#6366f1",
    deployed: "#8b5cf6",
  };

  return (
    <NodeResizer node={node}>
      {({ width, height }) => (
        <div className={classes.strategyCard} style={{ width, height }}>
          <div className={classes.strategyHeader}>
            <h3 className={classes.strategyTitle}>{node.data.title}</h3>
            <div className={classes.strategyTrader}>{node.data.trader}</div>
          </div>
          <div className={classes.strategyProgress}>
            <div className={classes.progressBar}>
              <div
                className={classes.progressFill}
                style={{
                  width: `${node.data.winRate}%`,
                  backgroundColor: statusColors[node.data.status],
                }}
              />
            </div>
            <div className={classes.progressText}>
              {node.data.signals} signals • {node.data.winRate}% win rate
            </div>
          </div>
          <div className={classes.strategyStatus} data-status={node.data.status}>
            {node.data.status === "paused" && "Paused"}
            {node.data.status === "active" && "Active"}
            {node.data.status === "testing" && "Testing"}
            {node.data.status === "deployed" && "Deployed"}
          </div>
        </div>
      )}
    </NodeResizer>
  );
};

// Trading Metric Renderer
const TradingMetricRenderer = ({ node }: NodeRenderProps<TradingMetricData>) => {
  return (
    <NodeResizer node={node}>
      {({ width, height }) => (
        <div className={classes.metricCard} style={{ width, height }}>
          <div className={classes.metricHeader}>
            <h3 className={classes.metricTitle}>{node.data.title}</h3>
            <div className={classes.metricType}>
              <span className={classes.metricIcon}>📊</span> {node.data.metricType}
            </div>
          </div>
          <div className={classes.metricPeriods}>
            <div className={classes.metricPeriod}>
              <div className={classes.periodLabel}>Past 24h</div>
              <div className={classes.periodValue}>
                {node.data.symbol}
                {formatValue(node.data.past1day.value)}
              </div>
              <div
                className={classes.periodChange}
                data-positive={node.data.past1day.change !== null && node.data.past1day.change >= 0}
              >
                {formatPercentage(node.data.past1day.change)} ↑
              </div>
            </div>
            <div className={classes.metricPeriod}>
              <div className={classes.periodLabel}>Past 1 week</div>
              <div className={classes.periodValue}>
                {node.data.symbol}
                {formatValue(node.data.past1week.value)}
              </div>
              <div
                className={classes.periodChange}
                data-positive={node.data.past1week.change !== null && node.data.past1week.change >= 0}
              >
                {formatPercentage(node.data.past1week.change)} ↑
              </div>
            </div>
            <div className={classes.metricPeriod}>
              <div className={classes.periodLabel}>Past 1 month</div>
              <div className={classes.periodValue}>
                {node.data.symbol}
                {formatValue(node.data.past1month.value)}
              </div>
              <div
                className={classes.periodChange}
                data-positive={node.data.past1month.change !== null && node.data.past1month.change >= 0}
              >
                {formatPercentage(node.data.past1month.change)} ↑
              </div>
            </div>
          </div>
        </div>
      )}
    </NodeResizer>
  );
};

// Performance Metric Renderer (with target)
const PerformanceMetricRenderer = ({ node }: NodeRenderProps<PerformanceMetricData>) => {
  return (
    <NodeResizer node={node}>
      {({ width, height }) => (
        <div className={classes.metricCard} style={{ width, height }}>
          <div className={classes.metricHeader}>
            <h3 className={classes.metricTitle}>{node.data.title}</h3>
            <div className={classes.metricType}>
              <span className={classes.metricIcon}>🎯</span> {node.data.metricType}
            </div>
          </div>
          {node.data.target && (
            <div className={classes.targetInfo}>
              <div className={classes.targetLabel}>
                Target: {node.data.target.value.toLocaleString()} {node.data.target.label}
              </div>
            </div>
          )}
          <div className={classes.metricPeriods}>
            <div className={classes.metricPeriod}>
              <div className={classes.periodLabel}>24h</div>
              <div className={classes.periodValue}>{formatValue(node.data.past1day.value)}</div>
              <div
                className={classes.periodChange}
                data-positive={node.data.past1day.change !== null && node.data.past1day.change >= 0}
              >
                {formatPercentage(node.data.past1day.change)}
              </div>
            </div>
            <div className={classes.metricPeriod}>
              <div className={classes.periodLabel}>1 week</div>
              <div className={classes.periodValue}>{formatValue(node.data.past1week.value)}</div>
              <div
                className={classes.periodChange}
                data-positive={node.data.past1week.change !== null && node.data.past1week.change >= 0}
              >
                {formatPercentage(node.data.past1week.change)}
              </div>
            </div>
            <div className={classes.metricPeriod}>
              <div className={classes.periodLabel}>1 month</div>
              <div className={classes.periodValue}>{formatValue(node.data.past1month.value)}</div>
              <div
                className={classes.periodChange}
                data-positive={node.data.past1month.change !== null && node.data.past1month.change >= 0}
              >
                {formatPercentage(node.data.past1month.change)}
              </div>
            </div>
          </div>
          {node.data.variance !== undefined && (
            <div className={classes.varianceBadge} data-negative={node.data.variance < 0}>
              {node.data.variance.toFixed(3)}
            </div>
          )}
        </div>
      )}
    </NodeResizer>
  );
};

// Portfolio Metric Renderer
const PortfolioMetricRenderer = ({ node }: NodeRenderProps<PortfolioMetricData>) => {
  return (
    <NodeResizer node={node}>
      {({ width, height }) => (
        <div className={classes.metricCard} style={{ width, height }}>
          <div className={classes.metricHeader}>
            <h3 className={classes.metricTitle}>{node.data.title}</h3>
            <div className={classes.metricType}>
              <span className={classes.metricIcon}>💼</span> {node.data.metricType}
            </div>
          </div>
          <div className={classes.metricPeriods}>
            <div className={classes.metricPeriod}>
              <div className={classes.periodLabel}>Past 24h</div>
              <div className={classes.periodValue}>
                {node.data.symbol}
                {formatValue(node.data.past1day.value)}
              </div>
              <div
                className={classes.periodChange}
                data-positive={node.data.past1day.change !== null && node.data.past1day.change >= 0}
              >
                {formatPercentage(node.data.past1day.change)} ↑
              </div>
            </div>
            <div className={classes.metricPeriod}>
              <div className={classes.periodLabel}>Past 1 week</div>
              <div className={classes.periodValue}>
                {node.data.symbol}
                {formatValue(node.data.past1week.value)}
              </div>
              <div
                className={classes.periodChange}
                data-positive={node.data.past1week.change !== null && node.data.past1week.change >= 0}
              >
                {formatPercentage(node.data.past1week.change)} ↑
              </div>
            </div>
            <div className={classes.metricPeriod}>
              <div className={classes.periodLabel}>Past 1 month</div>
              <div className={classes.periodValue}>
                {node.data.symbol}
                {formatValue(node.data.past1month.value)}
              </div>
              <div
                className={classes.periodChange}
                data-positive={node.data.past1month.change !== null && node.data.past1month.change >= 0}
              >
                {formatPercentage(node.data.past1month.change)} ↑
              </div>
            </div>
          </div>
        </div>
      )}
    </NodeResizer>
  );
};

// Node Definitions
const AlgoTradingStrategyDefinition = createNodeDefinition<StrategyCardData>({
  type: "algo-strategy",
  displayName: "Algorithm Trading Strategy",
  category: "Trading",
  defaultData: {
    title: "New Strategy",
    trader: "Trader",
    signals: 0,
    winRate: 0,
    status: "paused",
  },
  defaultSize: { width: 220, height: 140 },
  renderNode: StrategyCardRenderer,
  ports: [
    {
      id: "output",
      type: "output",
      label: "",
      position: "right",
      renderPort: renderTradingPort,
      renderConnection: renderTradingConnection,
    },
  ],
});

const SignalSourceDefinition = createNodeDefinition<StrategyCardData>({
  type: "signal-source",
  displayName: "Signal Source",
  category: "Trading",
  defaultData: {
    title: "New Signal",
    trader: "Source",
    signals: 0,
    winRate: 0,
    status: "paused",
  },
  defaultSize: { width: 220, height: 120 },
  renderNode: StrategyCardRenderer,
  ports: [
    {
      id: "output",
      type: "output",
      label: "",
      position: "right",
      renderPort: renderTradingPort,
      renderConnection: renderTradingConnection,
    },
  ],
});

const TradingVolumeDefinition = createNodeDefinition<TradingMetricData>({
  type: "trading-volume",
  displayName: "Trading Volume",
  category: "Metrics",
  defaultData: {
    title: "Trading Volume",
    metricType: "Volume",
    past1day: { value: 0, change: 0 },
    past1week: { value: 0, change: 0 },
    past1month: { value: 0, change: 0 },
    trendDirection: "up",
  },
  defaultSize: { width: 320, height: 180 },
  renderNode: TradingMetricRenderer,
  ports: [
    {
      id: "input",
      type: "input",
      label: "",
      position: "left",
      renderPort: renderTradingPort,
      renderConnection: renderTradingConnection,
    },
    {
      id: "output",
      type: "output",
      label: "",
      position: "right",
      renderPort: renderTradingPort,
      renderConnection: renderTradingConnection,
    },
  ],
});

const PerformanceMetricDefinition = createNodeDefinition<PerformanceMetricData>({
  type: "performance-metric",
  displayName: "Performance Metric",
  category: "Metrics",
  defaultData: {
    title: "Performance",
    metricType: "Performance",
    past1day: { value: 0, change: 0 },
    past1week: { value: 0, change: 0 },
    past1month: { value: 0, change: 0 },
  },
  defaultSize: { width: 320, height: 240 },
  renderNode: PerformanceMetricRenderer,
  ports: [
    {
      id: "input",
      type: "input",
      label: "",
      position: "left",
      renderPort: renderTradingPort,
      renderConnection: renderTradingConnection,
    },
    {
      id: "output",
      type: "output",
      label: "",
      position: "right",
      renderPort: renderTradingPort,
      renderConnection: renderTradingConnection,
    },
  ],
});

const PortfolioMetricDefinition = createNodeDefinition<PortfolioMetricData>({
  type: "portfolio-metric",
  displayName: "Portfolio Metric",
  category: "Portfolio",
  defaultData: {
    title: "Portfolio Value",
    metricType: "Portfolio",
    past1day: { value: 0, change: 0 },
    past1week: { value: 0, change: 0 },
    past1month: { value: 0, change: 0 },
  },
  defaultSize: { width: 280, height: 160 },
  renderNode: PortfolioMetricRenderer,
  ports: [
    {
      id: "input",
      type: "input",
      label: "",
      position: "left",
      renderPort: renderTradingPort,
      renderConnection: renderTradingConnection,
    },
    {
      id: "output",
      type: "output",
      label: "",
      position: "right",
      renderPort: renderTradingPort,
      renderConnection: renderTradingConnection,
    },
  ],
});

export const createTradingNodeDefinitions = (): NodeDefinition[] => [
  toUntypedDefinition(AlgoTradingStrategyDefinition),
  toUntypedDefinition(SignalSourceDefinition),
  toUntypedDefinition(TradingVolumeDefinition),
  toUntypedDefinition(PerformanceMetricDefinition),
  toUntypedDefinition(PortfolioMetricDefinition),
];
