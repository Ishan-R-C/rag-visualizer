"use client";

import { useState } from "react";
import { Button } from "../button";
import Embedding3D from "../embedding-3d";
import { LoaderCircle } from "lucide-react";
import { Input } from "../input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";

interface TopChunk {
  index: number;
  chunk: string;
  similarity: number;
}
interface VectorEmbeddingProps {
  chunkData: string[];
  setEmbeddings: any;
}

const VectorEmbedding: React.FC<VectorEmbeddingProps> = ({
  chunkData,
  setEmbeddings,
}) => {
  const [loading, isLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [points, setPoints] = useState<number[][]>([]);
  const [queryPoint, setQueryPoint] = useState<number[] | null>(null);
  const [topChunks, setTopChunks] = useState<TopChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>("");

  const handleEmbedding = async () => {
    if (!chunkData || chunkData.length === 0) {
      setError("Please split the text before generating embeddings.");
      return;
    }

    setError(null);
    setQueryPoint(null);
    setTopChunks([]);
    setQuery("");
    setProgress(0);
    setStage("");
    isLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/embed-3d-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunks: chunkData }),
        },
      );

      if (!response.ok || !response.body) {
        setError("Something went wrong while generating embeddings.");
        isLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Each chunk from the server may contain one or more newline-delimited JSON lines
        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter((l) => l.trim().length > 0);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.progress !== undefined) setProgress(data.progress);
            if (data.stage) setStage(data.stage);
            if (data.points) {
              setPoints(data.points);
              setEmbeddings(true);
            }
            if (data.error) {
              setError(data.error);
            }
          } catch {
            // Partial line — safe to ignore, next read will complete it
          }
        }
      }
    } catch (err) {
      setError("Something went wrong while generating embeddings.");
      console.error(err);
    } finally {
      isLoading(false);
    }
  };

  const handleQueryEmbedding = async () => {
    if (!query || query.trim().length === 0) {
      setError("Please enter your query.");
      return;
    }
    if (points.length === 0) {
      setError("Please generate chunk embeddings first.");
      return;
    }

    setError(null);
    setQueryLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/embed-query`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim() }),
        },
      );
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setQueryPoint(data.point);
      setTopChunks(data.top_chunks);
    } catch (err) {
      setError("Something went wrong while embedding your query.");
      console.error(err);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleQueryEmbedding();
  };

  return (
    <div className="m-16 flex flex-col gap-2 mt-4 mb-0 border-2 border-dashed border-slate-300 p-7 pt-8 rounded-2xl bg-linear-to-bl from-white/50 to-white/70 max-w-full">
      <p className="text-[2.5rem] font-extrabold tracking-tight text-gray-900">
        Vector Embeddings
      </p>
      <div className="text-slate-600 text-md font-semibold mb-2">
        Chunks created in the previous stage are now embedded into a vector
        space based on their semantic similarity.
        <ol className="list-disc">
          <li className="ml-[1.4rem]">
            The vector space usually involves multiple dimensions where words
            that are semantically similar are often represented by vectors that
            are close to each other.
          </li>
          <li className="ml-[1.4rem]">
            In other words, vector embeddings are a numerical representation of
            a particular data object.
          </li>
        </ol>
      </div>
      <p className="font-semibold italic text-gray-600 mb-3">
        Embedding model used here:{" "}
        <a
          href="https://ai.google.dev/gemini-api/docs/embeddings"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600"
        >
          gemini-embedding-001
        </a>
        .
      </p>

      {error && <p className="text-red-600 font-semibold mb-3">{error}</p>}

      {loading && !error && (
        <div className="flex flex-col items-center gap-3 mb-5 w-full">
          <LoaderCircle
            size={60}
            className="text-blue-600 animate-spin mt-5"
            strokeWidth={2.5}
          />
          <p className="text-lg font-semibold text-gray-600 mt-1">
            {stage || "Loading..."}
          </p>
          <Field className="w-full max-w-sm">
            <FieldLabel htmlFor="progress-embed">
              <span>Embedding progress</span>
              <span className="ml-auto">{Math.round(progress)}%</span>
            </FieldLabel>
            <Progress value={progress} id="progress-embed" />
          </Field>
        </div>
      )}

      {!loading && (
        <Button
          className="ml-2 w-40 cursor-pointer hover:bg-blue-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold mb-3"
          onClick={handleEmbedding}
        >
          Show Vector Space
        </Button>
      )}

      {points.length > 0 && !loading && !error && (
        <div className="flex justify-between pl-8 pr-8">
          <Embedding3D
            points={points}
            queryPoint={queryPoint}
            topChunkIndices={topChunks.map((item) => item.index)}
          />
          <div className="w-150 h-125 rounded-2xl border border-border bg-background/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 p-6">
            <p className="text-slate-900 text-xl font-semibold mb-1">
              For Clarification
            </p>
            <p className="text-slate-600 text-sm font-semibold">
              This graph uses UMAP (Uniform Manifold Approximation and
              Projection) to reduce the high-dimensional embedding vectors
              (typically 384 or 768 dimensions) into 3D space for visualization
              purposes. Actual closest chunks are identified through cosine
              similarity.
            </p>
            <div className="flex flex-row items-center mt-4 gap-3">
              <Input
                className="border-gray-400 text-lg placeholder:text-lg"
                placeholder="Enter a question"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={queryLoading}
              />
              <Button
                className="w-30 cursor-pointer hover:bg-blue-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold"
                onClick={handleQueryEmbedding}
                disabled={queryLoading}
              >
                {queryLoading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  "Plot Query"
                )}
              </Button>
            </div>
            {queryPoint && !queryLoading && (
              <div>
                <p className="text-green-600 text-sm font-semibold mt-2 pl-2">
                  Query plotted! The green point shows where your query sits in
                  the vector space.
                </p>
                <div>
                  {topChunks.length > 0 && (
                    <div className="mt-4">
                      <p className="text-slate-900 text-md font-semibold">
                        Similar Chunks
                      </p>
                      <div className="mt-2 flex flex-col gap-2 h-50 overflow-y-auto">
                        {topChunks.map((item) => (
                          <div
                            key={item.index}
                            className="rounded-xl border border-slate-200 bg-white/70 p-3 flex flex-col gap-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Chunk {item.index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-snug">
                              {item.chunk}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VectorEmbedding;
