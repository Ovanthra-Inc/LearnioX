import Link from "next/link";
import { HelpCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "404 Not Found — LearnioX",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center space-y-6">
        <p className="text-label-sm font-bold uppercase tracking-widest text-muted-foreground">
          Error Code 404
        </p>
        
        <h1 className="text-display-md font-bold uppercase tracking-tighter">
          Lost at Sea
        </h1>

        <p className="text-body-md text-muted-foreground leading-relaxed">
          The classroom page or studio dashboard you tried to access does not exist or has been archived.
        </p>

        <div className="space-y-3 pt-4">
          <Link
            href="/"
            className="w-full block py-3 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
          >
            Go to Homepage
          </Link>
          
          <Link
            href="/search"
            className="w-full block py-3 border border-border bg-card text-foreground text-label-md uppercase tracking-wider font-bold hover:bg-surface-container transition-colors"
          >
            Browse Course Directory
          </Link>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <HelpCircle className="w-4 h-4" /> Need help?{" "}
          <Link href="/support" className="underline hover:text-foreground font-semibold">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
