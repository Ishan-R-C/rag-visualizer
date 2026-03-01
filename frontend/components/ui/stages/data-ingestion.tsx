"use client";
import { useState } from "react";
import { Button } from "../button";
import { Card } from "../card";
import { LoaderCircle, Upload } from "lucide-react";

const DataIngestion = ({ setIngestedData }: any) => {
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [loading, isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleReset = () => {
    setFileInfo(null);
  };
  const handleError = () => {
    setFileInfo(null);
    setError(null);
    isLoading(false);
  };
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files[0];

    const max_size = 2 * 1024 * 1024; //2MB

    const formData = new FormData();
    formData.append("file", file);
    isLoading(true);

    if (file.size > max_size) {
      setError("File size must be less than 2MB.");
      return;
    }
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setFileInfo(data);
      setIngestedData(data);
    } catch (error) {
      console.error(error);
      setError("Unable to upload. Please try again.");
    }
    isLoading(false);
  };

  return (
    <div className="m-16 flex flex-col items-center gap-3 mt-4 mb-0 border-2 border-dashed border-slate-300 p-10 pt-4 rounded-2xl bg-linear-to-bl from-white/50 to-white/70">
      <p className="text-[3rem] font-extrabold tracking-tight text-gray-900">
        Data Ingestion
      </p>
      <p className="text-slate-600 text-lg font-semibold mb-3">
        Start the RAG pipeline by providing a PDF document{" "}
        <span className="text-red-500">(under 2MB)</span> for ingestion.
      </p>
      {!fileInfo && !loading && !error && (
        <Card
          className="
             flex flex-col items-center justify-center gap-2
             border-2 border-dashed border-slate-300
             hover:border-blue-500
             transition-all duration-300
             rounded-2xl
             p-12
             text-center
             hover:shadow-xl hover:scale-[1.02]"
        >
          <div className="bg-blue-50 p-6 rounded-full">
            <Upload size={38} className="text-blue-600" strokeWidth={2.5} />
          </div>
          <p className="text-lg font-semibold text-gray-800">Upload your PDF</p>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            className="text-sm text-slate-500
               file:w-full
               file:py-2.5
               file:rounded-lg
               file:border-0
               file:text-sm
               file:font-semibold
               file:bg-blue-600
               file:text-white
               hover:file:bg-blue-700
               file:transition-all
               file:duration-200
               file:cursor-pointer
               cursor-pointer"
          />
        </Card>
      )}
      {loading && !error && (
        <div className="flex flex-col items-center gap-2">
          <LoaderCircle
            size={70}
            className="text-blue-600 animate-spin mt-10"
            strokeWidth={2.5}
          />
          <p className="text-lg font-semibold text-gray-600">
            Loading Your File
          </p>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center gap-2 mt-2 p-10 border border-dashed border-red-400 rounded-2xl bg-white/80">
          <p className="text-lg font-semibold text-red-500">{error}</p>
          <Button
            className="mt-2 cursor-pointer bg-red-500 hover:shadow-2xl hover:scale-105 transition-all duration-300"
            onClick={handleError}
          >
            Reset
          </Button>
        </div>
      )}
      {fileInfo && (
        <div className="mt-4 max-w-sm w-full bg-white/90 backdrop-blur-md shadow-xl rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:shadow-2xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex justify-center">
            File Details
          </h2>

          <div className="space-y-3 text-md text-gray-600">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">File</span>
              <span className="truncate max-w-[60%] text-right">
                {fileInfo.filename}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Pages</span>
              <span>{fileInfo.page_count}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Characters</span>
              <span>{fileInfo.character_count.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              className="px-4 py-2 w-30 bg-blue-600 text-white rounded-lg font-semibold 
                 hover:bg-blue-700 hover:scale-105 active:scale-95 
                 transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </div>
      )}
      {!fileInfo && !loading && !error && (
        <p className="font-semibold italic text-gray-600">
          Don't have a pdf at hand? Try{" "}
          <a
            href="https://arxiv.org/abs/2005.11401"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600"
          >
            this
          </a>{" "}
          as an example.
        </p>
      )}
    </div>
  );
};
export default DataIngestion;
