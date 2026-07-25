import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
  { to: "/team", label: "Team" },
] as const;

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const items = isAdmin ? [...NAV, { to: "/admin", label: "Admin" } as const] : NAV;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="Claimly logo" width={32} height={32} className="size-8 rounded-lg" />
          <span className="font-display text-xl leading-none tracking-tight">Claimly</span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-x-4 gap-y-1 text-[13px] whitespace-nowrap text-muted-foreground dark:text-white lg:flex">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="transition-colors hover:text-foreground [&.active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-border p-2 transition-colors hover:bg-secondary lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
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
      {open && (
        <nav className="border-t border-border/70 bg-background/95 px-5 py-3 lg:hidden">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground dark:text-white sm:grid-cols-3">
            {items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block py-1 transition-colors hover:text-foreground [&.active]:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
