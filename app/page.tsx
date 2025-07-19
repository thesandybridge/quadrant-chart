'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

interface ApiResponse {
  property1: number;
  property2: number;
  property3: number;
  property4: number;
}

interface Point {
  x: number;
  y: number;
}

interface HistoryPoint extends Point {
  id: number;
}

export default function QuadrantGraphPage() {
  const [point, setPoint] = useState<Point>({ x: 50, y: 50 });
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  // Generate grid lines - memoized to prevent recreation on every render
  const renderGridLines = useCallback(() => {
    const lines = [];
    const gridStep = 10; // Grid lines every 10%

    // Vertical grid lines
    for (let i = gridStep; i < 100; i += gridStep) {
      if (i !== 50) { // Skip the center line as we already have the y-axis
        lines.push(
          <line
            key={`v-${i}`}
            x1={`${i}`}
            y1="0"
            x2={`${i}`}
            y2="100"
            className={styles.gridLine}
          />
        );
      }
    }

    // Horizontal grid lines
    for (let i = gridStep; i < 100; i += gridStep) {
      if (i !== 50) { // Skip the center line as we already have the x-axis
        lines.push(
          <line
            key={`h-${i}`}
            x1="0"
            y1={`${i}`}
            x2="100"
            y2={`${i}`}
            className={styles.gridLine}
          />
        );
      }
    }

    return lines;
  }, []);

  // Function to update point from API data
  const updatePointFromApi = useCallback((data: ApiResponse) => {
    const x = (data.property1 + data.property2) / 2;
    const y = (data.property3 + data.property4) / 2;
    setPoint({ x, y });
  }, []);

  // Effect for initial data fetch and interval setup
  useEffect(() => {
    // Simulate initial API response
    const initialData: ApiResponse = {
      property1: 90,
      property2: 45,
      property3: 60,
      property4: 30,
    };

    updatePointFromApi(initialData);

    // Simulate new data coming in every 3 seconds
    const interval = setInterval(() => {
      // Generate random values for demonstration
      const newData: ApiResponse = {
        property1: Math.random() * 100,
        property2: Math.random() * 100,
        property3: Math.random() * 100,
        property4: Math.random() * 100,
      };

      updatePointFromApi(newData);
    }, 3000);

    return () => clearInterval(interval);
  }, [updatePointFromApi]);

  // Separate effect to update history when point changes
  useEffect(() => {
    // Only add to history if we have a valid point
    if (point.x >= 0 && point.y >= 0) {
      setHistory(prev => {
        // Create new history array with current point
        const newPoint = { ...point, id: Date.now() };
        const newHistory = [...prev, newPoint];

        // Keep only the last 5 points
        if (newHistory.length > 5) {
          return newHistory.slice(-5);
        }
        return newHistory;
      });
    }
  }, [point.x, point.y]);

  // Render the component
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Quadrant Graph</h1>

      <div className={styles.graphContainer}>
        <svg
          className={styles.graph}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Colored quadrants */}
          <rect x="50" y="0" width="50" height="50" className={styles.q1} />
          <rect x="0" y="0" width="50" height="50" className={styles.q2} />
          <rect x="0" y="50" width="50" height="50" className={styles.q3} />
          <rect x="50" y="50" width="50" height="50" className={styles.q4} />

          {/* Grid lines */}
          {renderGridLines()}

          {/* Axes */}
          <line x1="0" y1="50" x2="100" y2="50" className={styles.axis} />
          <line x1="50" y1="0" x2="50" y2="100" className={styles.axis} />

          {/* Quadrant labels */}
          <text x="75" y="15" className={styles.quadrantLabel}>Quadrant 1</text>
          <text x="25" y="15" className={styles.quadrantLabel}>Quadrant 2</text>
          <text x="25" y="85" className={styles.quadrantLabel}>Quadrant 3</text>
          <text x="75" y="85" className={styles.quadrantLabel}>Quadrant 4</text>

          {/* Scale markers */}
          <text x="5" y="95" className={styles.scaleMarker}>0</text>
          <text x="50" y="95" className={styles.scaleMarker}>50</text>
          <text x="95" y="95" className={styles.scaleMarker}>100</text>
          <text x="5" y="50" className={styles.scaleMarker}>50</text>
          <text x="5" y="5" className={styles.scaleMarker}>100</text>

          {/* History trail */}
          {history.map((historyPoint, index) => (
            <circle
              key={historyPoint.id}
              cx={historyPoint.x}
              cy={100 - historyPoint.y}
              r={1.5 + index * 0.3}
              className={styles.historyPoint}
              style={{ opacity: 0.2 + (index * 0.15) }}
            />
          ))}

          {/* Current point */}
          <circle
            cx={point.x}
            cy={100 - point.y}
            r="3"
            className={styles.dataPoint}
          />

          {/* Current coordinates */}
          <text
            x={point.x + 5}
            y={100 - point.y - 5}
            className={styles.coordsLabel}
          >
            ({point.x.toFixed(1)}, {point.y.toFixed(1)})
          </text>
        </svg>
      </div>

      <div className={styles.info}>
        <h2>Current Position</h2>
        <p>X: {point.x.toFixed(2)}</p>
        <p>Y: {point.y.toFixed(2)}</p>
      </div>
    </div>
  );
}

