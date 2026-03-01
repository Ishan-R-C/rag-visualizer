"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
});

interface Embedding3DProps {
  points: number[][];
  queryPoint?: number[] | null;
  topChunkIndices?: number[]; // ← new
}

const Embedding3D: React.FC<Embedding3DProps> = ({
  points,
  queryPoint,
  topChunkIndices,
}) => {
  const x = points.map((p) => p[0]);
  const y = points.map((p) => p[1]);
  const z = points.map((p) => p[2]);

  const traces: Plotly.Data[] = [
    {
      type: "scatter3d",
      mode: "markers",
      x,
      y,
      z,
      name: "Chunks",
      text: points.map((_, index) => `Chunk ${index + 1}`),
      hovertemplate:
        "<b>%{text}</b><br>" +
        "x: %{x:.3f}<br>" +
        "y: %{y:.3f}<br>" +
        "z: %{z:.3f}" +
        "<extra></extra>",
      marker: {
        size: 6,
        color: z,
        colorscale: "Turbo",
        opacity: 0.9,
      },
    },
  ];

  // Only add query trace when we have a point
  if (queryPoint) {
    // Lines to top chunks
    if (topChunkIndices && topChunkIndices.length > 0) {
      const lineX: number[] = [];
      const lineY: number[] = [];
      const lineZ: number[] = [];

      topChunkIndices.forEach((idx) => {
        const p = points[idx];
        lineX.push(p[0], queryPoint[0], null as any);
        lineY.push(p[1], queryPoint[1], null as any);
        lineZ.push(p[2], queryPoint[2], null as any);
      });

      traces.push({
        type: "scatter3d",
        mode: "lines" as const,
        x: lineX,
        y: lineY,
        z: lineZ,
        name: "Nearest Links",
        line: { color: "#1bca24", width: 2 },
        hoverinfo: "skip",
      } as Plotly.Data);
    }

    // Query point marker — always shown when queryPoint exists
    traces.push({
      type: "scatter3d" as const,
      mode: "text+markers" as const,
      x: [queryPoint[0]],
      y: [queryPoint[1]],
      z: [queryPoint[2]],
      name: "Your Query",
      hovertemplate:
        "<b>Your Query</b><br>" +
        "x: %{x:.3f}<br>" +
        "y: %{y:.3f}<br>" +
        "z: %{z:.3f}" +
        "<extra></extra>",
      marker: {
        size: 10,
        color: "#1bca24",
        opacity: 1,
        line: { color: "#ffffff", width: 2 },
      },
    } as Plotly.Data);
  }

  return (
    <div className="w-150 h-125 rounded-2xl border border-border bg-background/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 cursor-grab active:cursor-grabbing">
      <Plot
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
        data={traces}
        layout={{
          autosize: true,
          margin: { l: 10, r: 10, t: 10, b: 10 },
          paper_bgcolor: "transparent",
          legend: {
            x: 0,
            y: 1,
            font: { size: 11 },
            bgcolor: "rgba(255,255,255,0.6)",
            bordercolor: "#e2e8f0",
            borderwidth: 1,
          },
          scene: {
            bgcolor: "transparent",
            camera: {
              eye: { x: 1.5, y: 1.5, z: 1.5 },
            },
          },
        }}
        config={{
          displayModeBar: false,
          scrollZoom: true,
        }}
      />
    </div>
  );
};

export default Embedding3D;
