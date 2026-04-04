import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Background luxury glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 -right-20 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center">
        <div className="mb-6 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-bold uppercase tracking-widest text-primary border border-primary/20">
          Error 404
        </div>

        <h1 className="mb-4 text-8xl font-black tracking-tighter text-primary sm:text-9xl">
          404
        </h1>

        <h2 className="mb-6 text-2xl font-bold text-foreground sm:text-3xl">
          Lost in the Gold Standard?
        </h2>

        <p className="mx-auto mb-10 max-w-md text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to the dashboard.
        </p>

        <Button size="lg" className="group h-14 px-8 text-base font-bold shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all hover:scale-105 active:scale-95" asChild>
          <Link to="/">
            <Home className="mr-2 h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
            Return Home
          </Link>
        </Button>
      </div>

      {/* Subtle branding text */}
      <div className="absolute bottom-8 text-sm font-medium text-muted-foreground/40">
        © 2024 The Gold Card. Elevate your standard.
      </div>
    </div>
  );
};

export default NotFound;
