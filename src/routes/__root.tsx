import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { MotionProvider } from "@/lib/motion";
import { LiveProducts } from "@/lib/live-products";
import { ChatAssistant } from "@/components/site/ChatAssistant";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MiniCart } from "@/components/site/MiniCart";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow text-muted-foreground">Error 404</p>
        <h1 className="display-lg mt-3">Lost the thread.</h1>
        <p className="mt-4 text-sm text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="btn-solid mt-8">Back home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. Try again or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-solid">Try again</button>
          <a href="/" className="btn-outline">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ThePoshakCo — Indian Streetwear" },
      { name: "description", content: "Premium Indian streetwear inspired by art, culture and people." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ThePoshakCo" },
      { property: "og:title", content: "ThePoshakCo — Indian Streetwear" },
      { property: "og:description", content: "Premium Indian streetwear inspired by art, culture and people." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Playfair+Display:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = pathname === "/auth" || pathname === "/reset-password" || pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
      <StoreProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:p-3 focus:text-primary-foreground">Skip to content</a>
        {!bare && <Header />}
        <main id="main">
          <Outlet />
        </main>
        {!bare && <Footer />}
        <MiniCart />
        <LiveProducts />
        {!bare && <ChatAssistant />}
        <Toaster position="bottom-center" />
      </StoreProvider>
      </MotionProvider>
    </QueryClientProvider>
  );
}
