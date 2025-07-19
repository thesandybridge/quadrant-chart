'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './styles.module.css';

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
  id: string;
}

export default function Quadrant() {
  const [point, setPoint] = useState<Point>({ x: 50, y: 50 });
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [properties, setProperties] = useState<ApiResponse>({
    property1: 50,
    property2: 50,
    property3: 50,
    property4: 50
  });
  const [isAutoMode, setIsAutoMode] = useState(true);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const handlePropertyChange = (property: keyof ApiResponse, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      // Round to 2 decimal places
      const roundedValue = Math.round(numValue * 100) / 100;
      setProperties(prev => ({
        ...prev,
        [property]: roundedValue
      }));
    }
  };

  const handleManualUpdate = () => {
    updatePointFromApi(properties);
  };

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

  // Function to update point from API data with corrected quadrant mapping
  // Function to update point from API data with improved quadrant mapping
  const updatePointFromApi = useCallback((data: ApiResponse) => {
    // Store the original properties
    setProperties(data);

    // Normalize all properties to 0-1 range (assuming 0-100 input range)
    const p1 = data.property1 / 100;
    const p2 = data.property2 / 100;
    const p3 = data.property3 / 100;
    const p4 = data.property4 / 100;

    // Calculate x and y coordinates based on weighted influence of each property
    // Each property pulls toward its respective corner

    // Calculate weighted average for x-coordinate
    // p1 and p4 pull right (toward x=100), p2 and p3 pull left (toward x=0)
    const xNumerator = (p1 * 100) + (p2 * 0) + (p3 * 0) + (p4 * 100);
    const xDenominator = p1 + p2 + p3 + p4;

    // Calculate weighted average for y-coordinate
    // p1 and p2 pull up (toward y=100), p3 and p4 pull down (toward y=0)
    const yNumerator = (p1 * 100) + (p2 * 100) + (p3 * 0) + (p4 * 0);
    const yDenominator = p1 + p2 + p3 + p4;

    // Calculate final position, defaulting to center if all properties are 0
    const x = xDenominator > 0 ? xNumerator / xDenominator : 50;
    const y = yDenominator > 0 ? yNumerator / yDenominator : 50;

    // Update the point position
    setPoint({ x, y });

    // Log the properties and calculated position
    console.log('Point moved. Properties and position:', {
      property1: data.property1.toFixed(2),
      property2: data.property2.toFixed(2),
      property3: data.property3.toFixed(2),
      property4: data.property4.toFixed(2),
      calculatedX: x.toFixed(2),
      calculatedY: y.toFixed(2)
    });
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

  // Update history when point changes
  useEffect(() => {
    // Skip initial render or when point hasn't changed
    if (point.x === 50 && point.y === 50 && history.length === 0) {
      return;
    }

    // Only add to history if we have a valid point
    if (point.x >= 0 && point.y >= 0) {
      // Check if this point is significantly different from the last one
      const lastPoint = history.length > 0 ? history[history.length - 1] : null;
      const isSignificantChange = !lastPoint ||
        Math.abs(lastPoint.x - point.x) > 1 ||
        Math.abs(lastPoint.y - point.y) > 1;

      if (isSignificantChange) {
        // Use crypto.randomUUID() for a guaranteed unique ID
        const newPoint = {
          ...point,
          id: crypto.randomUUID()
        };

        // Update history
        setHistory(prev => {
          const newHistory = [...prev, newPoint];
          // Keep only the last 5 points
          if (newHistory.length > 5) {
            return newHistory.slice(-5);
          }
          return newHistory;
        });
      }
    }
  }, [history, point, point.x, point.y]); // Remove history from dependencies

  // Effect for handling auto mode
  useEffect(() => {
    // Clean up any existing interval first
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Only set up interval if in auto mode
    if (isAutoMode) {
      // Generate initial random data
      const initialData: ApiResponse = {
        property1: Math.random() * 100,
        property2: Math.random() * 100,
        property3: Math.random() * 100,
        property4: Math.random() * 100,
      };

      updatePointFromApi(initialData);

      // Set up new interval with a longer delay
      intervalIdRef.current = setInterval(() => {
        const newData: ApiResponse = {
          property1: Math.random() * 100,
          property2: Math.random() * 100,
          property3: Math.random() * 100,
          property4: Math.random() * 100,
        };

        updatePointFromApi(newData);
      }, 5000); // 5 seconds interval
    }

    // Cleanup function
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isAutoMode, updatePointFromApi]);

  // Helper function to determine which quadrant the point is in
  const getQuadrant = (x: number, y: number): number => {
    if (x >= 50 && y >= 50) return 1; // Top right
    if (x < 50 && y >= 50) return 2;  // Top left
    if (x < 50 && y < 50) return 3;   // Bottom left
    return 4;                         // Bottom right
  };

  // Render the component
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Quadrant Graph</h1>

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
        <p>X: {point.x.toFixed(2)}, Y: {point.y.toFixed(2)}</p>
        <p>Quadrant: {getQuadrant(point.x, point.y)}</p>

        {/* Manual input controls */}
        {!isAutoMode && (
          <div className={styles.manualControls}>
            <h3>Manual Property Controls</h3>
            <div className={styles.inputGrid}>
              <div className={`${styles.inputGroup} ${styles.q1Input}`}>
                <label htmlFor="property1">Property 1 (Q1):</label>
                <input
                  id="property1"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={properties.property1.toFixed(2)}
                  onChange={(e) => handlePropertyChange('property1', e.target.value)}
                />
              </div>
              <div className={`${styles.inputGroup} ${styles.q2Input}`}>
                <label htmlFor="property2">Property 2 (Q2):</label>
                <input
                  id="property2"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={properties.property2.toFixed(2)}
                  onChange={(e) => handlePropertyChange('property2', e.target.value)}
                />
              </div>
              <div className={`${styles.inputGroup} ${styles.q3Input}`}>
                <label htmlFor="property3">Property 3 (Q3):</label>
                <input
                  id="property3"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={properties.property3.toFixed(2)}
                  onChange={(e) => handlePropertyChange('property3', e.target.value)}
                />
              </div>
              <div className={`${styles.inputGroup} ${styles.q4Input}`}>
                <label htmlFor="property4">Property 4 (Q4):</label>
                <input
                  id="property4"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={properties.property4.toFixed(2)}
                  onChange={(e) => handlePropertyChange('property4', e.target.value)}
                />
              </div>
            </div>
            <button
              className={styles.updateButton}
              onClick={handleManualUpdate}
            >
              Update Position
            </button>
          </div>
        )}

        {/* Display original properties */}
        <h3>Current Properties</h3>
        <div className={styles.propertiesGrid}>
          <div className={`${styles.property} ${styles.q1Property}`}>
            <span>Property 1 (Q1):</span>
            <span>{properties.property1.toFixed(2)}</span>
          </div>
          <div className={`${styles.property} ${styles.q2Property}`}>
            <span>Property 2 (Q2):</span>
            <span>{properties.property2.toFixed(2)}</span>
          </div>
          <div className={`${styles.property} ${styles.q3Property}`}>
            <span>Property 3 (Q3):</span>
            <span>{properties.property3.toFixed(2)}</span>
          </div>
          <div className={`${styles.property} ${styles.q4Property}`}>
            <span>Property 4 (Q4):</span>
            <span>{properties.property4.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

