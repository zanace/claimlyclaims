import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="max-w-md">
          Claimly is an independent tool, not a government agency. We help you understand and apply
          for benefits you may already qualify for.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <Link to="/programs" className="hover:text-foreground">
            Programs
          </Link>
          <Link to="/eligibility" className="hover:text-foreground">
            Eligibility
          </Link>
          <Link to="/claims" className="hover:text-foreground">
            My claims
          </Link>
          <Link to="/documents" className="hover:text-foreground">
            Documents
          </Link>
          <Link to="/chat" className="hover:text-foreground">
            Assistant
          </Link>
          <Link to="/auth" className="hover:text-foreground">
            Log in
          </Link>
          <Link to="/legal" className="hover:text-foreground">
            Privacy &amp; terms
          </Link>
        </div>
      </div>
    </footer>
  );
}