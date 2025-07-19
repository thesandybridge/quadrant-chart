'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './styles.module.css';

interface DataPoint {
  label: string;
  value: number;
}

export default function RadarChartPage() {
  // Initial data
  const initialData: DataPoint[] = [
    { label: 'Speed', value: 70 },
    { label: 'Power', value: 85 },
    { label: 'Range', value: 60 },
    { label: 'Durability', value: 90 },
    { label: 'Accuracy', value: 75 },
    { label: 'Handling', value: 80 }
  ];

  const [data, setData] = useState<DataPoint[]>(initialData);
  const [activePoint, setActivePoint] = useState<DataPoint | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Chart configuration
  const size = 500;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;
  const levels = 5; // Number of concentric circles
  const maxValue = 100; // Maximum value for scaling
  const fillColor = "rgba(53, 162, 235, 0.2)";
  const lineColor = "rgb(53, 162, 235)";
  const pointColor = "rgb(53, 162, 235)";

  // Randomize data function
  const randomizeData = useCallback(() => {
    setData(currentData => currentData.map(point => ({
      ...point,
      value: Math.floor(Math.random() * 80) + 20 // Random value between 20-100
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

  // Calculate points on the radar chart
  const calculatePoints = () => {
    const angleSlice = (Math.PI * 2) / data.length;

    return data.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2; // Start from top (subtract PI/2)
      const distanceFromCenter = (d.value / maxValue) * radius;

      return {
        x: centerX + distanceFromCenter * Math.cos(angle),
        y: centerY + distanceFromCenter * Math.sin(angle),
        label: d.label,
        value: d.value,
        angle
      };
    });
  };

  // Calculate points for the radar chart
  const points = calculatePoints();

  // Generate the path for the radar shape
  const generateRadarPath = () => {
    return points.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`);
    }, '') + ' Z'; // Close the path
  };

  // Generate concentric circles for level indicators
  const generateLevelCircles = () => {
    const circles = [];

    for (let i = 1; i <= levels; i++) {
      const levelRadius = (radius / levels) * i;
      circles.push(
        <circle
          key={`level-${i}`}
          cx={centerX}
          cy={centerY}
          r={levelRadius}
          className={styles.levelCircle}
        />
      );
    }

    return circles;
  };

  // Generate axis lines
  const generateAxisLines = () => {
    return data.map((_, i) => {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      return (
        <line
          key={`axis-${i}`}
          x1={centerX}
          y1={centerY}
          x2={centerX + radius * Math.cos(angle)}
          y2={centerY + radius * Math.sin(angle)}
          className={styles.axisLine}
        />
      );
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Radar Chart</h1>

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
          viewBox={`0 0 ${size} ${size}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Level circles */}
          {generateLevelCircles()}

          {/* Axis lines */}
          {generateAxisLines()}

          {/* Radar area */}
          <path
            d={generateRadarPath()}
            className={styles.radarArea}
            fill={fillColor}
          />

          {/* Radar outline */}
          <path
            d={generateRadarPath()}
            className={styles.radarStroke}
            stroke={lineColor}
            fill="none"
          />

          {/* Data points and labels */}
          {points.map((point, i) => {
            // Calculate label position outside the point
            const labelDistance = radius * 1.1;
            const labelX = centerX + labelDistance * Math.cos(point.angle);
            const labelY = centerY + labelDistance * Math.sin(point.angle);

            // Determine text anchor based on position
            const textAnchor =
              point.angle === -Math.PI / 2 ? "middle" :
              point.angle > -Math.PI / 2 && point.angle < Math.PI / 2 ? "start" : "end";

            return (
              <g key={`point-${i}`}>
                {/* Axis label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className={styles.axisLabel}
                >
                  {point.label}
                </text>

                {/* Data point */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={pointColor}
                  className={styles.dataPoint}
                  onMouseEnter={() => setActivePoint(data[i])}
                  onMouseLeave={() => setActivePoint(null)}
                />

                {/* Value label that appears on hover */}
                {activePoint === data[i] && (
                  <g>
                    <rect
                      x={point.x - 20}
                      y={point.y - 25}
                      width="40"
                      height="20"
                      rx="4"
                      className={styles.tooltipBg}
                    />
                    <text
                      x={point.x}
                      y={point.y - 15}
                      textAnchor="middle"
                      className={styles.tooltipText}
                    >
                      {point.value}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Level labels (percentage) */}
          {Array.from({ length: levels }).map((_, i) => {
            const levelValue = ((i + 1) / levels) * maxValue;
            return (
              <text
                key={`level-label-${i}`}
                x={centerX}
                y={centerY - ((i + 1) * radius) / levels}
                textAnchor="middle"
                dominantBaseline="middle"
                className={styles.levelLabel}
              >
                {levelValue}
              </text>
            );
          })}
        </svg>
      </div>

      <div className={styles.info}>
        <h2>Chart Information</h2>
        <p>This radar chart displays various attributes on a scale of 0-100.</p>

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
              <span>{point.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

