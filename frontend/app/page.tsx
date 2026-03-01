import { Button } from "@/components/ui/button";
import Footer from "@/components/ui/footer";
import Header from "@/components/ui/header";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Brain,
  CircleChevronDown,
  Database,
  FileText,
  Search,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex md:hidden min-h-screen items-center justify-center bg-gray-100 px-6">
        <div className="text-center space-y-4">
          <p className="text-5xl">🖥️</p>
          <p className="text-2xl font-extrabold text-gray-900">Desktop Only</p>
          <p className="text-gray-600">
            This experience is not available on mobile. Please visit on a
            desktop or laptop for the full pipeline visualization.
          </p>
        </div>
      </div>

      <div className="hidden md:block min-h-screen bg-linear-to-tr from-gray-100 to-gray-200">
        <Header />

        <div className="flex justify-center items-center flex-col space-y-6 px-4 py-8">
          <p className="pt-20 text-center text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight text-gray-900">
            Visualize How{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
              RAG
            </span>{" "}
            Really Works
          </p>

          <p className="text-center text-lg md:text-2xl font-medium tracking-tight text-gray-800 max-w-6xl">
            Upload a PDF and interactively explore how Retrieval-Augmented
            Generation works. Visualize the chunking, embeddings, vector search,
            and the reasoning behind the final answer.
          </p>

          <p className="text-center text-lg font-semibold text-gray-600 italic">
            No black boxes. Just clarity.
          </p>

          <Link href="/pipeline">
            <Button className="cursor-pointer w-50 h-15 text-lg hover:bg-blue-600 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              Start Visualizing
            </Button>
          </Link>
          <div className="flex flex-row items-center gap-15 h-10 mt-5">
            <p className="text-center text-2xl font-semibold text-gray-800">
              Interactive Pipeline
            </p>
            <Separator
              orientation="vertical"
              className="bg-gray-900 p-[1.2px]"
            />
            <p className="text-center text-2xl font-semibold text-gray-800">
              Visual Explanations
            </p>
            <Separator
              orientation="vertical"
              className="bg-gray-900 p-[1.2px]"
            />
            <p className="text-center text-2xl font-semibold text-gray-800">
              Real AI Workflow
            </p>
          </div>
          <div className="animate-bounce">
            <CircleChevronDown size={40} className="mt-15 text-blue-600" />
          </div>
        </div>

        <div className="mt-10 flex flex-row items-center w-full gap-x-2 mb-6">
          <Separator className="bg-linear-to-r from-gray-300 to-gray-600 flex-1 ml-5" />
          <p className="font-extrabold tracking-tight text-gray-700 text-xl text-center whitespace-nowrap">
            THE PIPELINE
          </p>
          <Separator className="bg-linear-to-l from-gray-300 to-gray-600 flex-1 mr-5" />
        </div>

        <div className="flex justify-center items-center flex-row gap-2 px-4 py-8 mb-6">
          <div className="flex flex-col items-center bg-white/80 w-60 h-55 border-gray-400 border rounded-2xl p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <FileText className="w-8 h-8 text-blue-500 mb-2" />
            <p className="font-semibold text-xl text-center">Text Splitting</p>
            <Separator className="bg-gray-400 mt-2" />
            <p className="text-sm mt-2 text-center">
              Raw data is collected from documents, databases, and APIs, then
              split into smaller, structured chunks to preserve context.
            </p>
          </div>

          <ArrowRight size={60} color="#212121" strokeWidth={3} />

          <div className="flex flex-col items-center bg-white/80 w-60 h-55 border-gray-400 border rounded-2xl p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <Database className="w-8 h-8 text-purple-500 mb-2" />
            <p className="font-semibold text-xl text-center">
              Vector Embedding
            </p>
            <Separator className="bg-gray-400 mt-2" />
            <p className="text-sm mt-2 text-center">
              Each text chunk is then converted into a semantic numerical
              vector, allowing the system to understand meaning and similarity.
            </p>
          </div>

          <ArrowRight size={60} color="#212121" strokeWidth={3} />

          <div className="flex flex-col items-center bg-white/80 w-60 h-55 border-gray-400 border rounded-2xl p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <Search className="w-8 h-8 text-orange-500 mb-2 stroke-2.5" />
            <p className="font-semibold text-xl text-center">Semantic Search</p>
            <Separator className="bg-gray-400 mt-2" />
            <p className="text-sm mt-2 text-center">
              When a query is made, the system compares vectors to retrieve the
              most contextually relevant information.
            </p>
          </div>

          <ArrowRight size={60} color="#212121" strokeWidth={3} />

          <div className="flex flex-col items-center bg-white/80 w-60 h-55 border-gray-400 border rounded-2xl p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <Brain className="w-8 h-8 text-green-500 mb-2" />
            <p className="font-semibold text-xl text-center">
              Response Generation
            </p>
            <Separator className="bg-gray-400 mt-2" />
            <p className="text-sm mt-2 text-center">
              Finally, the retrieved context is combined with the model’s
              reasoning to generate a clear, accurate, and context-aware
              response.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
