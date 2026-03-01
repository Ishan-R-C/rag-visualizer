"use client";

import { CircleQuestionMark, LoaderCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "../input";
import { useState } from "react";
import { Button } from "../button";

interface ResponseGenerationProps {
  embeddings: any;
}

const ResponseGeneration: React.FC<ResponseGenerationProps> = ({
  embeddings,
}) => {
  const [temp, setTemp] = useState(0.1);
  const [topK, setTopK] = useState(20);
  const [topP, setTopP] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [query, setQuery] = useState<string>("");
  const [systemMessage, setSystemMessage] = useState<string>(
    "You are a helpful assistant. \n\nAnswer questions strictly based on the provided context. Be concise and accurate. \n\nIf the context does not contain enough information to answer, clearly state that the information was not found in the document before providing a general answer based on your own knowledge.",
  );
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [loading, isLoading] = useState(false);

  const handleReset = async () => {
    setError(null);
    isLoading(false);
    setTemp(0.1);
    setTopK(20);
    setTopP(0.7);
    setMaxTokens(1000);
    setQuery("");
    setSystemMessage(
      "You are a helpful assistant. \n\nAnswer questions strictly based on the provided context. Be concise and accurate. \n\nIf the context does not contain enough information to answer, clearly state that the information was not found in the document before providing a general answer based on your own knowledge.",
    );
    setAnswer("");
  };
  const handleResponse = async () => {
    isLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/generate-response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            temperature: temp,
            top_k: topK,
            top_p: topP,
            max_tokens: maxTokens,
            system_message: systemMessage,
            query: query,
          }),
        },
      );

      const data = await res.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred.");
    } finally {
      isLoading(false);
    }
  };

  return (
    <div className="m-16 flex flex-col gap-2 mt-4 mb-0 border-2 border-dashed border-slate-300 p-7 pt-8 rounded-2xl bg-linear-to-bl from-white/50 to-white/70 max-w-full">
      <p className="text-[2.5rem] font-extrabold tracking-tight text-gray-900">
        Response Generation
      </p>
      <div className="text-slate-600 text-md font-semibold mb-3">
        Relevant chunks are retrieved and passed alongside the user's query to
        keep the final response grounded in your data, reducing hallucinations.
        The following parameters shape how the model generates its answer:
      </div>

      <div className="flex flex-row items-center gap-10">
        <div className="flex flex-row items-center">
          <p className="font-semibold text-slate-600 mr-1">Temperature:</p>
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
                  Controls how random/creative the responses are. Values between
                  0.1 and 0.4 are best for factual responses. Anything above 1.2
                  risks incoherent or unreliable output.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            className="w-20 border-gray-400 text-center text-lg placeholder:text-lg"
            placeholder="0.1"
            type="number"
            min={0.0}
            step={0.1}
            max={2.0}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-row items-center">
          <p className="font-semibold text-slate-600 mr-1">Top K:</p>
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
                  Limits the pool of words the model can choose from at each
                  step. Values between 10 and 40 work well for most cases.
                  Setting it below 5 can make responses feel unnatural and
                  repetitive.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            className="w-20 border-gray-400 text-center text-lg placeholder:text-lg"
            placeholder="20"
            type="number"
            min={1}
            max={100}
            step={1}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-row items-center">
          <p className="font-semibold text-slate-600 mr-1">Top P:</p>
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
                  Filters out unlikely word choices before generating a
                  response. Keep between 0.7 and 0.95 for balanced output.
                  Values too close to 0 make responses repetitive and robotic.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            className="w-20 border-gray-400 text-center text-lg placeholder:text-lg"
            placeholder="0.7"
            type="number"
            min={0.0}
            max={1.0}
            step={0.1}
            value={topP}
            onChange={(e) => setTopP(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-row items-center">
          <p className="font-semibold text-slate-600 mr-1">
            Max Output Tokens:
          </p>
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
                  Sets the maximum length of the generated response. Aim for 256
                  to 1024 for typical answers. Setting it too low may cut off
                  responses mid-sentence, while very high values increase
                  latency and cost.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            className="w-20 border-gray-400 text-center text-lg placeholder:text-lg"
            placeholder="1000"
            type="number"
            min={1}
            max={2000}
            step={1}
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 mt-3">
        <div className="flex flex-row">
          <p className="font-semibold text-slate-600 mr-1">System Message:</p>
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
                  A fixed instruction given to the model before the conversation
                  starts. It sets the model's behavior, tone, and boundaries for
                  every response it generates.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          className="border-gray-400 w-225"
          placeholder="You are a helpful assistant. Answer questions strictly based on the provided context.Be concise and accurate. If the context does not contain enough information to answer, clearly state that the information was not found in the document before providing a general answer based on your own knowledge."
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-semibold text-slate-600 mr-1">Query:</p>
        <Textarea
          className="border-gray-400 w-225"
          placeholder="Enter a question."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="flex flex-row gap-3 mb-2">
        <Button
          className="mt-2 w-50 cursor-pointer hover:bg-blue-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold"
          disabled={!embeddings || loading || !query}
          onClick={handleResponse}
        >
          Generate Response
        </Button>
        <Button
          className="mt-2 w-50 cursor-pointer hover:bg-blue-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold"
          disabled={!embeddings || loading}
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
      {error && <p className="text-red-600 font-semibold mb-3">{error}</p>}
      {loading && !error && (
        <div className="flex flex-col items-center gap-2 mb-5">
          <LoaderCircle
            size={70}
            className="text-blue-600 animate-spin mt-5"
            strokeWidth={2.5}
          />
          <p className="text-lg font-semibold text-gray-600 mt-2">
            Loading Response. Please wait a few minutes.
          </p>
        </div>
      )}
      {answer && !loading && !error && (
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-slate-600 mr-1">Response:</p>
          <div className="border p-3 rounded-md border-gray-400 shadow-lg bg-white w-225">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};
export default ResponseGeneration;
