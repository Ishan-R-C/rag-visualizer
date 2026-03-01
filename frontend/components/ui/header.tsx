import { Layers } from "lucide-react";
import Link from "next/link";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto h-16 px-4 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-2 text-[22px] font-bold">
            <Layers className="w-6 h-6 text-blue-600" />
            <span>
              RAG<span className="text-blue-600">Viz</span>
            </span>
          </div>
        </Link>

        <div className="flex items-center">
          <div className="rounded-full bg-gray-200 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-300 uppercase tracking-wider">
            v1.0.0-beta
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
