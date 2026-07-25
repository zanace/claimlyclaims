import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="max-w-md">
          Claimly is an independent tool, not a government agency. We help you understand and apply
          for benefits you may already qualify for.
        </p>
        <div className="flex gap-6">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <Link to="/programs" className="hover:text-foreground">
            Programs
          </Link>
          <Link to="/chat" className="hover:text-foreground">
            Assistant
          </Link>
        </div>
      </div>
    </footer>
  );
}