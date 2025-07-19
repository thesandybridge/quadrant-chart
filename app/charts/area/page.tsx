'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import styles from './styles.module.css';

interface DataPoint {
  label: string;
  value: number;
}

export default function AreaChartPage() {
  // Initial data
  const initialData: DataPoint[] = [
    { label: 'Jan', value: 30 },
    { label: 'Feb', value: 50 },
    { label: 'Mar', value: 45 },
    { label: 'Apr', value: 70 },
    { label: 'May', value: 65 },
    { label: 'Jun', value: 90 },
    { label: 'Jul', value: 85 },
    { label: 'Aug', value: 100 },
    { label: 'Sep', value: 75 },
    { label: 'Oct', value: 80 },
    { label: 'Nov', value: 60 },
    { label: 'Dec', value: 70 }
  ];

  const [data, setData] = useState<DataPoint[]>(initialData);
  const [activePoint, setActivePoint] = useState<{ point: DataPoint; x: number; y: number } | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Chart configuration
  const width = 700;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const areaColor = "rgba(53, 162, 235, 0.2)";
  const lineColor = "rgb(53, 162, 235)";
  const pointColor = "rgb(53, 162, 235)";
  const xAxisLabel = "Month";
  const yAxisLabel = "Sales ($K)";

  // Calculate dimensions accounting for margins
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Find min and max values for scaling
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);

  // Calculate scaling factors
  const xScale = innerWidth / (data.length - 1);
  const yScale = innerHeight / maxValue;

  // Generate paths
  const paths = useMemo(() => {
    // Line path
    const linePath = data.reduce((path, point, index) => {
      const x = index * xScale;
      const y = innerHeight - (point.value * yScale);

      return path + (index === 0 ? `M ${x},${y}` : ` L ${x},${y}`);
    }, '');

    // Area path
    const areaPath = `${linePath} L ${innerWidth},${innerHeight} L 0,${innerHeight} Z`;

    return { linePath, areaPath };
  }, [data, xScale, yScale, innerHeight, innerWidth]);

  // Generate axis ticks
  const yTicks = useMemo(() => {
    const tickCount = 5;
    const ticks = [];

    for (let i = 0; i <= tickCount; i++) {
      const value = (maxValue / tickCount) * i;
      ticks.push({
        value,
        y: innerHeight - (value * yScale)
      });
    }

    return ticks;
  }, [maxValue, innerHeight, yScale]);

  // Handle tooltip positioning
  const handleTooltipPosition = (x: number, y: number) => {
    return {
      x: x + margin.left,
      y: y + margin.top
    };
  };

  // Randomize data function
  const randomizeData = useCallback(() => {
    setData(currentData => currentData.map(point => ({
      ...point,
      value: Math.floor(Math.random() * 100) + 20 // Random value between 20-120
    })));
  }, []);

  // Toggle between auto and manual modes
  const toggleMode = () => {
    const newMode = !isAutoMode;
    setIsAutoMode(newMode);

    // Clear existing interval if switching to manual mode
    if (!newMode && intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  // Effect for handling auto mode
  useEffect(() => {
    // Clean up any existing interval first
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Only set up interval if in auto mode
    if (isAutoMode) {
      // Initial randomization
      randomizeData();

      // Set up interval for continuous updates
      intervalIdRef.current = setInterval(() => {
        randomizeData();
      }, 5000); // 5 seconds interval
    }

    // Cleanup function
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isAutoMode, randomizeData]);

  // Function to get label position based on point location
  const getLabelPosition = (x: number, y: number, text: string) => {
    // Estimate text width (rough approximation)
    const textWidth = text.length * 5;
    const textHeight = 12;

    // Define boundaries with padding
    const padding = 5;
    const rightBoundary = innerWidth - padding - textWidth;
    const topBoundary = padding + textHeight;

    // Default position (top-right)
    const position = {
      x: x + 5,
      y: y - 5,
      anchor: "start" as "start" | "end" | "middle"
    };

    // Check right edge
    if (x > rightBoundary) {
      position.x = x - 5;
      position.anchor = "end";
    }

    // Check top edge
    if (y < topBoundary) {
      position.y = y + 15;
    }

    return position;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Monthly Sales Data</h1>

      {/* Mode toggle switch */}
      <div className={styles.modeToggle}>
        <span className={!isAutoMode ? styles.activeMode : ''}>Manual</span>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={isAutoMode}
            onChange={toggleMode}
          />
          <span className={styles.slider}></span>
        </label>
        <span className={isAutoMode ? styles.activeMode : ''}>Auto</span>
      </div>

      <div className={styles.graphContainer}>
        <svg
          className={styles.graph}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid lines */}
            {yTicks.map((tick, i) => (
              <line
                key={`grid-${i}`}
                x1="0"
                y1={tick.y}
                x2={innerWidth}
                y2={tick.y}
                className={styles.gridLine}
              />
            ))}

            {/* Area fill */}
            <path
              d={paths.areaPath}
              fill={areaColor}
              className={styles.area}
            />

            {/* Line on top of area */}
            <path
              d={paths.linePath}
              stroke={lineColor}
              className={styles.line}
            />

            {/* Data points */}
            {data.map((point, index) => {
              const x = index * xScale;
              const y = innerHeight - (point.value * yScale);

              // Get position for value label
              const labelPos = getLabelPosition(x, y, point.value.toString());

              return (
                <g key={`point-${index}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={pointColor}
                    className={styles.dataPoint}
                  />

                  {/* Value label that appears on hover */}
                  {activePoint?.point === point && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor={labelPos.anchor}
                      className={styles.valueLabel}
                    >
                      {point.value}
                    </text>
                  )}

                  {/* Invisible larger circle for better hover target */}
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="transparent"
                    className={styles.hoverTarget}
                    onMouseEnter={() => {
                      const pos = handleTooltipPosition(x, y);
                      setActivePoint({
                        point,
                        x: pos.x,
                        y: pos.y
                      });
                    }}
                    onMouseLeave={() => setActivePoint(null)}
                  />
                </g>
              );
            })}

            {/* X-axis */}
            <line
              x1="0"
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              className={styles.axis}
            />

            {/* Y-axis */}
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={innerHeight}
              className={styles.axis}
            />

            {/* X-axis labels */}
            {data.map((point, index) => (
              <text
                key={`x-label-${index}`}
                x={index * xScale}
                y={innerHeight + 20}
                className={styles.xLabel}
              >
                {point.label}
              </text>
            ))}

            {/* Y-axis ticks and labels */}
            {yTicks.map((tick, i) => (
              <React.Fragment key={`y-tick-${i}`}>
                <line
                  x1="-5"
                  y1={tick.y}
                  x2="0"
                  y2={tick.y}
                  className={styles.tick}
                />
                <text
                  x="-10"
                  y={tick.y}
                  className={styles.yLabel}
                >
                  {Math.round(tick.value)}
                </text>
              </React.Fragment>
            ))}

            {/* Axis titles */}
            <text
              x={innerWidth / 2}
              y={innerHeight + 40}
              className={styles.axisTitle}
            >
              {xAxisLabel}
            </text>

            <text
              x={-innerHeight / 2}
              y={-40}
              transform="rotate(-90)"
              className={styles.axisTitle}
            >
              {yAxisLabel}
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.info}>
        <h2>Chart Information</h2>
        <p>This area chart displays monthly sales data for the year.</p>

        {!isAutoMode && (
          <div className={styles.manualControls}>
            <button
              className={styles.updateButton}
              onClick={randomizeData}
            >
              Randomize Data
            </button>
          </div>
        )}

        <h3>Data Points</h3>
        <div className={styles.propertiesGrid}>
          {data.map((point, index) => (
            <div key={index} className={styles.property}>
              <span>{point.label}:</span>
              <span>${point.value}K</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

