"use client";

import Footer from "@/components/ui/footer";
import Header from "@/components/ui/header";
import DataIngestion from "@/components/ui/stages/data-ingestion";
import ResponseGeneration from "@/components/ui/stages/response-generation";
import TextSplitting from "@/components/ui/stages/text-splitting";
import VectorEmbedding from "@/components/ui/stages/vector-embedding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function Pipeline() {
  const [ingestedData, setIngestedData] = useState<any>(null);
  const [chunkData, setChunkData] = useState<string[]>([]);
  const [embeddings, setEmbeddings] = useState(false);
  return (
    <div className="bg-linear-to-tr from-gray-100 to-gray-200 ">
      <Header />
      <div className="ml-13 mt-2">
        <p className="text-[3rem] font-extrabold tracking-tight text-gray-900">
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
            RAG
          </span>{" "}
          Sandbox
        </p>
        <p className="text-lg font-medium tracking-tight text-gray-800">
          Explore the different stages of a RAG pipeline below.
        </p>
      </div>
      <div className="mt-6 mb-15 overflow-x-hidden">
        <Tabs defaultValue="di" className="min-w-screen items-center">
          <TabsList className="min-w-360">
            <TabsTrigger value="di">Data Ingestion</TabsTrigger>
            <TabsTrigger value="ts">Text Splitting</TabsTrigger>
            <TabsTrigger value="ve">Vector Embedding</TabsTrigger>
            <TabsTrigger value="rg">Response Generation</TabsTrigger>
          </TabsList>
          <TabsContent value="di" className="min-w-screen">
            <DataIngestion setIngestedData={setIngestedData} />
          </TabsContent>
          <TabsContent value="ts" className="min-w-screen">
            <TextSplitting
              ingestedData={ingestedData}
              setChunkData={setChunkData}
            />
          </TabsContent>
          <TabsContent value="ve" className="min-w-screen">
            <VectorEmbedding
              chunkData={chunkData}
              setEmbeddings={setEmbeddings}
            />
          </TabsContent>
          <TabsContent value="rg" className="min-w-screen">
            <ResponseGeneration embeddings={embeddings} />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
