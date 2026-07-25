import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/logo.png";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/programs", label: "Programs" },
  { to: "/money-you-could-get", label: "How much" },
  { to: "/blog", label: "Resources" },
  { to: "/eligibility", label: "Eligibility" },
  { to: "/claims", label: "My claims" },
  { to: "/documents", label: "Documents" },
  { to: "/chat", label: "Assistant" },
] as const;

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Claimly logo" width={32} height={32} className="size-8 rounded-lg" />
          <span className="font-display text-2xl leading-none tracking-tight">Claimly</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm whitespace-nowrap text-muted-foreground xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="transition-colors hover:text-foreground [&.active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="transition-colors hover:text-foreground [&.active]:text-foreground"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3.5">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden max-w-40 truncate rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
                title="Edit your profile"
              >
                {user.email}
              </Link>
              <button
                onClick={signOut}
                className="rounded-full border border-border px-4 py-2 text-sm whitespace-nowrap transition-colors hover:bg-secondary"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden rounded-full px-3 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:inline"
              >
                Log in
              </Link>
              <Link
                to="/auth"
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold whitespace-nowrap text-accent-foreground shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
