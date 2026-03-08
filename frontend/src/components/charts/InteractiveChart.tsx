"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DataPoint {
  x: string | number;
  y: number;
  value?: any;
}

interface InteractiveChartProps {
  data: DataPoint[];
  title: string;
  type?: 'line' | 'bar' | 'area';
  height?: number;
  onDrillDown?: (point: DataPoint) => void;
}

export function InteractiveChart({ 
  data, 
  title, 
  type = 'line', 
  height = 300,
  onDrillDown 
}: InteractiveChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  const formatValue = (value: number) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const handlePointClick = (point: DataPoint) => {
    setSelectedPoint(point);
    if (onDrillDown) {
      onDrillDown(point);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          {/* Simple SVG chart visualization */}
          <svg viewBox="0 0 400 200" className="w-full h-full">
            {type === 'line' && (
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={data.map(d => `${d.x},${d.y}`).join(' ')}
              />
            )}
            {type === 'bar' && (
              <>
                {data.map((d, i) => (
                  <rect
                    key={i}
                    x={i * (400 / data.length)}
                    y={200 - d.y}
                    width={400 / data.length - 4}
                    height={d.y}
                    fill="currentColor"
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handlePointClick(d)}
                  />
                ))}
              </>
            )}
            {type === 'area' && (
              <path
                d={`M ${data.map(d => `${d.x},${d.y}`).join(' L')} L 400,${data[data.length - 1]?.y || 0} Z`}
                fill="currentColor"
                fillOpacity="0.3"
                stroke="currentColor"
                strokeWidth="2"
              />
            )}
          </svg>

          {/* Interactive tooltip */}
          {selectedPoint && (
            <div 
              className="absolute bg-black text-white p-2 rounded shadow-lg text-sm z-10"
              style={{
                left: `${Math.min(...data.map(d => Number(d.x)))}px`,
                top: '20px'
              }}
            >
              <div className="font-semibold">{selectedPoint.x}</div>
              <div className="text-xs opacity-80">{formatValue(selectedPoint.y)}</div>
              {selectedPoint.value && (
                <div className="text-xs mt-1 pt-1 border-t border-white/20">
                  {JSON.stringify(selectedPoint.value, null, 2)}
                </div>
              )}
              <button
                className="absolute top-1 right-1 text-white hover:bg-gray-700 p-1 rounded"
                onClick={() => setSelectedPoint(null)}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
