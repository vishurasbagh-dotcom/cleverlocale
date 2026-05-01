import Link from "next/link";

type IconName = "dash" | "tree" | "shop" | "cart" | "users" | "gear" | "box" | "star";

type NavItem = { href: string; label: string; icon: IconName; soon?: boolean };
type NavSection = { section: string; items: NavItem[] };

function Icon({ name }: { name: IconName }) {
  const common = "h-5 w-5 shrink-0 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400";
  switch (name) {
    case "dash":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h7v7H4V5zm9 0h7v4h-7V5zM4 14h7v5H4v-5zm9 3h7v2h-7v-2z" />
        </svg>
      );
    case "tree":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6m0 0l-2.5-2.5M12 9l2.5-2.5M7 15h10M9 11v6m6-6v6" />
        </svg>
      );
    case "shop":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h2l1 12h12l1-12h2M9 13h6M8 5l-1-2h10l-1 2" />
        </svg>
      );
    case "cart":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16l-2 10H6L4 7zm0 0L3 3H1M9 21h6" />
        </svg>
      );
    case "users":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21v-1a5 5 0 0110 0v1M14 21v-1a5 5 0 00-10 0" />
        </svg>
      );
    case "gear":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm7.4-2.9l-1 .3-.9 2.4 1.5 1.8-2 2-1.8-1.5-2.4.9-.3 1h-2.8l-.3-1-2.4-.9-1.8 1.5-2-2 1.5-1.8-.9-2.4-1-.3V9.4l1-.3.9-2.4L5.2 5.2l2-2 1.8 1.5 2.4-.9.3-1h2.8l.3 1 2.4.9L18.8 3l2 2-1.5 1.8.9 2.4 1 .3v2.8z"
          />
        </svg>
      );
    case "box":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10" />
        </svg>
      );
    case "star":
      return (
        <svg className={common} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.8 5.7 21l2.3-7-6-4.6h7.6L12 2z" />
        </svg>
      );
  }
}

export function BackofficeShell({
  appLabel,
  sections,
  mobileLinks,
  showBackToStorefront = true,
  appLabelAction,
  sidebarFooter,
  notices,
  children,
}: {
  appLabel: string;
  sections: NavSection[];
  mobileLinks: { href: string; label: string }[];
  showBackToStorefront?: boolean;
  appLabelAction?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  notices?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-[1280px] gap-0 lg:gap-8 lg:px-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-0 flex h-screen flex-col border-r border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-5 py-6 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                  Cleverlocale
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{appLabel}</p>
                  {appLabelAction}
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">Management workspace</p>
            </div>
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
              {sections.map((group) => (
                <div key={group.section}>
                  <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{group.section}</p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        {item.soon ? (
                          <span className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 dark:text-zinc-600">
                            <Icon name={item.icon} />
                            <span className="flex-1">{item.label}</span>
                            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
                              Soon
                            </span>
                          </span>
                        ) : (
                          <Link
                            href={item.href}
                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-emerald-50 hover:text-emerald-900 dark:text-zinc-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-100"
                          >
                            <Icon name={item.icon} />
                            {item.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            {sidebarFooter ? (
              <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">{sidebarFooter}</div>
            ) : null}
            {showBackToStorefront ? (
              <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-zinc-800"
                >
                  ← Back to Homepage
                </Link>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{appLabel}</span>
            <div className="flex flex-wrap gap-3 text-sm">
              {mobileLinks.map((l) => (
                <Link key={l.href} href={l.href} className="text-emerald-700 dark:text-emerald-400">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="px-4 py-8 sm:px-6 lg:px-0 lg:py-10">
            {notices ? <div className="mb-6 space-y-3">{notices}</div> : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
