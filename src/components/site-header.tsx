import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown, Compass, LayoutDashboard, Building2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; hint?: string };
type NavGroup = { id: string; label: string; icon: typeof Compass; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    icon: Compass,
    items: [
      { to: "/", label: "Home", hint: "Find benefits by ZIP" },
      { to: "/how-it-works", label: "How it works", hint: "The 3-step process" },
      { to: "/programs", label: "Programs", hint: "150+ program directory" },
      { to: "/chat", label: "Assistant", hint: "Ask the AI anything" },
    ],
  },
  {
    id: "account",
    label: "My Claimly",
    icon: LayoutDashboard,
    items: [
      { to: "/dashboard", label: "Dashboard", hint: "Your overview" },
      { to: "/applications", label: "Applications", hint: "Status and history" },
      { to: "/vault", label: "Vault", hint: "Secure documents" },
      { to: "/saved", label: "Saved", hint: "Bookmarked programs" },
      { to: "/settings", label: "Settings", hint: "Smart Profile info" },
    ],
  },
  {
    id: "about",
    label: "About",
    icon: Building2,
    items: [
      { to: "/blog", label: "Resources", hint: "Guides and articles" },
      { to: "/team", label: "Team", hint: "The people behind Claimly" },
      { to: "/about", label: "About", hint: "Our mission" },
      { to: "/privacy", label: "Privacy", hint: "How we handle data" },
    ],
  },
];

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMenu(id: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(id);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 160);
  }

  const groups: NavGroup[] = isAdmin
    ? GROUPS.map((g) =>
        g.id === "account"
          ? { ...g, items: [...g.items, { to: "/admin", label: "Admin", hint: "Review applications" }] }
          : g,
      )
    : GROUPS;

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

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
          <span className="font-display text-xl leading-none tracking-tight text-black dark:text-white">Claimly</span>
        </Link>
        <div ref={navRef} className="hidden flex-1 items-center justify-center gap-2 lg:flex">
          {groups.map((group) => {
            const Icon = group.icon;
            const isOpen = menu === group.id;
            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => openMenu(group.id)}
                onMouseLeave={scheduleClose}
                onFocus={() => openMenu(group.id)}
                onBlur={scheduleClose}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  onClick={() => (isOpen ? setMenu(null) : openMenu(group.id))}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] whitespace-nowrap transition-colors ${
                    isOpen
                      ? "border-border bg-secondary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground dark:text-white"
                  }`}
                >
                  <Icon className="size-4 text-primary" />
                  {group.label}
                  <ChevronDown className={`size-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div
                    role="menu"
                    className="animate-mobile-nav absolute top-full left-1/2 z-50 w-64 origin-top -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-background/95 p-1.5 shadow-[var(--shadow-soft)] backdrop-blur-md before:absolute before:inset-x-0 before:-top-2 before:h-2 before:content-['']"
                    style={{ marginTop: "0.5rem" }}
                  >
                    {group.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setMenu(null)}
                        activeOptions={{ exact: item.to === "/" }}
                        className="block rounded-xl px-3 py-2 transition-colors hover:bg-secondary [&.active]:bg-secondary [&.active_.lbl]:font-semibold [&.active_.lbl]:text-primary"
                      >
                        <span className="lbl block text-sm text-foreground">{item.label}</span>
                        {item.hint && <span className="block text-xs text-muted-foreground">{item.hint}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-border p-2 transition-colors hover:bg-secondary lg:hidden"
          >
            <span className="relative block size-4">
              <Menu
                className={`absolute inset-0 size-4 transition-all duration-300 ${open ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
              />
              <X
                className={`absolute inset-0 size-4 transition-all duration-300 ${open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0"}`}
              />
            </span>
          </button>
          <ThemeToggle />
          {user ? (
            <>
              <Link
                to="/settings"
                className="hidden max-w-40 truncate rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
                title="Manage your saved info"
              >
                {user.email}
              </Link>
              <button
                onClick={signOut}
                className="rounded-full border border-border px-4 py-2 text-sm whitespace-nowrap text-black transition-colors hover:bg-secondary dark:text-white"
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
        <nav className="animate-mobile-nav origin-top overflow-hidden border-t border-border/70 bg-background/95 px-5 py-3 lg:hidden">
          <div className="grid gap-2">
            {groups.map((group, gi) => {
              const Icon = group.icon;
              const isOpen = mobileGroup === group.id;
              return (
                <div
                  key={group.id}
                  className="animate-mobile-nav-item overflow-hidden rounded-2xl border border-border/70 opacity-0"
                  style={{ animationDelay: `${60 + gi * 70}ms` }}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setMobileGroup((cur) => (cur === group.id ? null : group.id))}
                    className="flex w-full items-center gap-2 px-3 py-3 text-sm text-foreground"
                  >
                    <Icon className="size-4 text-primary" />
                    <span className="font-medium">{group.label}</span>
                    <ChevronDown
                      className={`ml-auto size-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="animate-mobile-nav origin-top border-t border-border/70 p-1.5">
                      {group.items.map((item, i) => (
                        <li
                          key={item.to}
                          className="animate-mobile-nav-item opacity-0"
                          style={{ animationDelay: `${40 + i * 35}ms` }}
                        >
                          <Link
                            to={item.to}
                            onClick={() => {
                              setOpen(false);
                              setMenu(null);
                              setMobileGroup(null);
                            }}
                            activeOptions={{ exact: item.to === "/" }}
                            className="block rounded-xl px-3 py-2 transition-colors hover:bg-secondary [&.active]:bg-secondary [&.active_.lbl]:font-semibold [&.active_.lbl]:text-primary"
                          >
                            <span className="lbl block text-sm text-foreground">{item.label}</span>
                            {item.hint && <span className="block text-xs text-muted-foreground">{item.hint}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
