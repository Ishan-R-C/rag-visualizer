import { Layers } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-100">
      <div className="h-25 mx-auto py-5 px-20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-semibold tracking-tight text-gray-900">
          <Layers className="w-6 h-6 text-blue-600" />
          <span>
            RAG<span className="text-blue-600">Viz</span>
          </span>
        </div>

        <p className="text-sm text-gray-400 flex items-center gap-1.5">
          Visualize and debug your RAG pipelines with clarity
        </p>

        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} RAGViz
        </p>
      </div>
    </footer>
  );
};

export default Footer;
