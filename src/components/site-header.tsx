import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Claimly logo" width={32} height={32} className="size-8 rounded-lg" />
          <span className="font-display text-2xl leading-none tracking-tight">Claimly</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/" className="transition-colors hover:text-foreground [&.active]:text-foreground">
            Home
          </Link>
          <Link
            to="/programs"
            className="transition-colors hover:text-foreground [&.active]:text-foreground"
          >
            Programs
          </Link>
          <Link
            to="/chat"
            className="transition-colors hover:text-foreground [&.active]:text-foreground"
          >
            Assistant
          </Link>
        </nav>
        <Link
          to="/chat"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
        >
          Start free check
        </Link>
      </div>
    </header>
  );
}