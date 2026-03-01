"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "../button";
import { CircleQuestionMark, LoaderCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
const colors = [
  "bg-blue-100",
  "bg-green-100",
  "bg-purple-100",
  "bg-yellow-100",
  "bg-pink-100",
  "bg-indigo-100",
  "bg-teal-100",
  "bg-orange-100",
  "bg-red-100",
  "bg-cyan-100",
  "bg-emerald-100",
  "bg-violet-100",
];

interface TextSplittingProps {
  ingestedData: any;
  setChunkData: React.Dispatch<React.SetStateAction<string[]>>;
}

const TextSplitting: React.FC<TextSplittingProps> = ({
  ingestedData,
  setChunkData,
}) => {
  const [strategy, setStrategy] = useState("fixed-size");
  const [chunkSize, setChunkSize] = useState(1000);
  const [overlap, setOverlap] = useState(200);
  const [chunks, setChunks] = useState<string[]>([]);
  const [numChunks, setNumChunks] = useState(0);
  const [avgChunkSize, setAvgChunkSize] = useState(0);
  const [numOverlaps, setNumOverlaps] = useState(0);
  const [avgOverlap, setAvgOverlap] = useState(0);
  const [minChunk, setMinChunk] = useState(0);
  const [maxChunk, setMaxChunk] = useState(0);

  const [loading, isLoading] = useState(false);
  const [error, setError] = useState<string | any>(null);
  const [splitStrategy, setSplitStrategy] = useState("fixed-size");
  const lastChunk =
    chunks.length > 0 ? chunks[Math.min(19, chunks.length - 1)] : null;
  const endIndex =
    lastChunk && ingestedData
      ? ingestedData.text.indexOf(lastChunk) + lastChunk.length
      : 0;
  const rawPreview = ingestedData ? ingestedData.text.slice(0, endIndex) : "";

  const handleSplit = async () => {
    if (!ingestedData) return;
    if (chunkSize <= overlap) {
      setError("Chunk Size must be greater than Overlap.");
      return;
    }
    setError(null);
    isLoading(true);
    try {
      const res = await fetch("http://localhost:8000/split-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ingestedData.text,
          strategy,
          chunk_size: chunkSize,
          overlap,
        }),
      });

      const data = await res.json();
      setChunks(data.chunks);
      setNumChunks(data.num_chunks);
      setAvgChunkSize(data.avg_chunk_size);
      setNumOverlaps(data.num_overlaps);
      setAvgOverlap(data.avg_overlap);
      setMinChunk(data.min_chunk_size);
      setMaxChunk(data.max_chunk_size);
      setSplitStrategy(strategy);

      setChunkData(data.chunks);

      isLoading(false);
    } catch (error) {
      console.error(error);
      setError(error);
    }
  };

  return (
    <div className="m-16 flex flex-col gap-2 mt-4 mb-0 border-2 border-dashed border-slate-300 p-7 pt-8 rounded-2xl bg-linear-to-bl from-white/50 to-white/70 max-w-full">
      <p className="text-[2.5rem] font-extrabold tracking-tight text-gray-900">
        Text Splitting
      </p>
      <div className="text-slate-600 text-md font-semibold">
        The pipeline begins by breaking up the ingested file into smaller chunks
        without losing the semantic coherence between these divisions.
        <ol className="list-disc">
          <li className="ml-[1.4rem]">
            <span className="text-gray-900">Fixed-Size Chunking:</span> Divides
            text into fixed-size segments (characters, tokens). This method is
            simple but may cut sentences in half, causing loss of context.
          </li>
          <li className="ml-[1.4rem]">
            <span className="text-gray-900">Recursive Character Chunking:</span>{" "}
            Iteratively breaks text using a set of separators (e.g., paragraphs,
            then sentences) to keep related text together.
          </li>
          <li className="ml-[1.4rem]">
            <span className="text-gray-900">Token-Based Chunking:</span> Splits
            text according to language model tokens rather than characters,
            ensuring optimal chunk sizes that align with LLM limits and improve
            efficiency of the pipeline.
          </li>
        </ol>
      </div>
      <p className="font-semibold italic text-gray-600 mb-3">
        For more info on text splitting strategies, refer to{" "}
        <a
          href="https://reference.langchain.com/python/langchain-text-splitters"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600"
        >
          this
        </a>
        .
      </p>
      <div className="flex flex-row items-center gap-3">
        <p className="font-semibold text-slate-600">
          Choose Splitting Strategy:
        </p>
        <Select value={strategy} onValueChange={setStrategy}>
          <SelectTrigger className="w-62.5 border border-gray-400">
            <SelectValue placeholder="Select Strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="fixed-size">Fixed-Size Chunking</SelectItem>
              <SelectItem value="recursive-character">
                Recursive Character Chunking
              </SelectItem>
              <SelectItem value="token">Token-Based Chunking</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-row items-center gap-18 mt-3">
        <div className="flex flex-row items-center">
          <p className="font-semibold text-slate-600 mr-1">Chunk Size:</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <CircleQuestionMark
                  size={17}
                  strokeWidth={2}
                  className="text-gray-400 mr-3 mt-[2.6px]"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-50 text-center font-semibold text-gray-300">
                  Maximum characters in each chunk. Small chunks improve
                  precision but lose context. Large chunks keep context but
                  reduce retrieval accuracy and increase cost.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            className="w-20 border-gray-400 text-center text-lg placeholder:text-lg"
            placeholder="500"
            type="number"
            min={0}
            step={1}
            value={chunkSize}
            onChange={(e) => setChunkSize(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-row items-center">
          <p className="font-semibold text-slate-600 mr-1">Chunk Overlap:</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <CircleQuestionMark
                  size={17}
                  strokeWidth={2}
                  className="text-gray-400 mr-3 mt-[2.6px]"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-50 text-center font-semibold text-gray-300">
                  Number of characters to overlap between chunks. Helps maintain
                  context across chunk boundaries.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            className="w-20 border-gray-400 text-center text-lg placeholder:text-lg"
            placeholder="50"
            type="number"
            min={0}
            step={1}
            value={overlap}
            onChange={(e) => setOverlap(Number(e.target.value))}
          />
        </div>
      </div>
      {error && <p className="font-semibold text-red-600">{error}</p>}

      <Button
        className="mt-5 w-30 cursor-pointer hover:bg-blue-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold"
        onClick={handleSplit}
      >
        Split Text
      </Button>
      {loading && !error && (
        <div className="flex flex-col items-center gap-2">
          <LoaderCircle
            size={70}
            className="text-blue-600 animate-spin mt-10"
            strokeWidth={2.5}
          />
          <p className="text-lg font-semibold text-gray-600">Loading Stats</p>
        </div>
      )}
      {!error && !loading && chunks.length > 0 && (
        <div className="flex gap-5 items-center mt-4 justify-center">
          <p className="border-2 bg-white/80 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
            Chunks: <span className="font-semibold">{numChunks}</span>
          </p>
          {splitStrategy !== "token" && (
            <p className="border-2 bg-white/80 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
              Average Chunk:{" "}
              <span className="font-semibold">{avgChunkSize} chars</span>
            </p>
          )}
          {splitStrategy === "token" && (
            <p className="border-2 bg-white/80 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
              Average Chunk:{" "}
              <span className="font-semibold">{avgChunkSize} tokens</span>
            </p>
          )}
          <p className="border-2 bg-white/80 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
            Overlaps: <span className="font-semibold">{numOverlaps}</span>
          </p>
          <p className="border-2 bg-white/80 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
            Average Overlap:{" "}
            <span className="font-semibold">{avgOverlap} chars</span>
          </p>
          {splitStrategy !== "token" && (
            <>
              <p className="border-2 bg-white/80 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
                Min Chunk Size:{" "}
                <span className="font-semibold">{minChunk} chars</span>
              </p>
              <p className="border-2 bg-white/80 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
                Max Chunk Size:{" "}
                <span className="font-semibold">{maxChunk} chars</span>
              </p>
            </>
          )}
          {splitStrategy === "token" && (
            <>
              <p className="border-2 bg-white/80 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
                Min Chunk Size:{" "}
                <span className="font-semibold">{minChunk} tokens</span>
              </p>
              <p className="border-2 bg-white/80 p-3 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
                Max Chunk Size:{" "}
                <span className="font-semibold">{maxChunk} tokens</span>
              </p>
            </>
          )}
        </div>
      )}
      {!error && !loading && chunks.length > 0 && (
        <div className="max-h-100 overflow-y-auto flex flex-col md:flex-row gap-4 mt-3">
          <div className="flex-1 p-5 border border-gray-200 rounded-xl bg-white shadow-outer overflow-x-hidden w-170">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Raw Data
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              {rawPreview}
            </p>
          </div>
          <div className="flex-1 p-5 border border-gray-200 rounded-xl bg-white shadow-outer overflow-x-hidden w-170">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Parsed Chunks
            </h4>
            <div className="flex flex-wrap gap-2">
              {chunks.slice(0, 20).map((chunk, index) => (
                <div key={index}>
                  <p className="font-semibold">Chunk {index + 1}</p>
                  <p
                    key={index}
                    className={`px-2 py-1 rounded-md text-sm font-mono ${colors[index % colors.length]}`}
                  >
                    {chunk}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TextSplitting;
