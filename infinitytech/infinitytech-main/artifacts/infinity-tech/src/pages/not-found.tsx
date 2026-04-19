import { Link } from "wouter";
import { TerminalSquare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <TerminalSquare className="w-16 h-16 text-primary/40 mx-auto mb-6" />
        <h1 className="text-4xl font-black text-foreground mb-3">404</h1>
        <p className="text-lg font-medium text-foreground mb-2">Page Not Found</p>
        <p className="text-sm text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
