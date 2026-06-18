import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  MapPinned,
  ShieldCheck,
  Users,
} from "lucide-react";

import prmscLogo from "@/assets/prmsc-logo.png";
import punjabLogo from "@/assets/punjab-govt-logo.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/modules/auth/use-auth";
import { roleToDashboardPath } from "@/modules/auth/roles";

type LocationState = { from?: string } | null;

const isDev = import.meta.env.DEV;

const features = [
  {
    icon: Users,
    title: "Role-based access",
    description: "Senior Managers, World Bank users, and Research Analysts.",
  },
  {
    icon: Building2,
    title: "Head Office & Tehsil",
    description: "Unified operations across every level of the organization.",
  },
  {
    icon: MapPinned,
    title: "Geography aware",
    description: "Manage tehsils, villages, and settlements with precision.",
  },
];

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as LocationState)?.from;

  const [email, setEmail] = useState(isDev ? "senior.manager@wfm.local" : "");
  const [password, setPassword] = useState(isDev ? "SeniorManager@123" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length >= 8,
    [email, password],
  );

  if (auth.status === "authenticated") {
    return <Navigate to={roleToDashboardPath(auth.user.role)} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await auth.signIn({ email: email.trim(), password });
      if (from) {
        navigate(from, { replace: true });
        return;
      }
      navigate(roleToDashboardPath(user.role), { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-svh w-full bg-gradient-to-br from-slate-50 via-background to-slate-100 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0a2e55] via-[#0d3a6b] to-[#08243f] text-white lg:flex lg:flex-col lg:items-center lg:justify-between lg:px-12 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-sky-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-20 size-80 rounded-full bg-emerald-400/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex w-full max-w-md flex-col items-center">
          <div className="flex items-center justify-center gap-5 rounded-2xl bg-white px-6 py-4 shadow-xl shadow-black/20 ring-1 ring-black/5">
            <img src={prmscLogo} alt="PRMSC" className="h-16 w-auto object-contain" />
            <span className="h-14 w-px bg-slate-200" />
            <img
              src={punjabLogo}
              alt="Government of Punjab"
              className="h-16 w-auto object-contain"
            />
          </div>
        </div>

        <div className="relative w-full max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm">
            <ShieldCheck className="size-4 text-emerald-300" />
            Secure enterprise portal
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight">
            Work Force
            <br />
            Management System
          </h1>
          <p className="text-base leading-relaxed text-white/70">
            Role-based access for Senior Managers, World Bank users, and Research
            Analysts across Head Office and Tehsil operations.
          </p>

          <div className="grid gap-3 pt-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm transition-colors hover:bg-white/[0.1]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/20 text-sky-200">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="text-xs leading-relaxed text-white/60">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative w-full max-w-md text-xs text-white/40">
          Punjab Rural Municipal Services Company &middot; Authorized personnel only
        </p>
      </section>

      <section className="flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="mb-8 flex items-center justify-center gap-5 rounded-2xl bg-white px-6 py-4 shadow-md ring-1 ring-border/60 lg:hidden">
          <img src={prmscLogo} alt="PRMSC" className="h-14 w-auto object-contain" />
          <span className="h-12 w-px bg-slate-200" />
          <img
            src={punjabLogo}
            alt="Government of Punjab"
            className="h-14 w-auto object-contain"
          />
        </div>

        <Card className="w-full max-w-md border-border/70 shadow-xl shadow-slate-200/60">
            <CardHeader className="space-y-1.5 border-b bg-muted/30">
              <CardTitle className="text-xl font-semibold tracking-tight">
                Sign in to your account
              </CardTitle>
              <CardDescription>
                Enter your organization credentials to access the portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@wfm.local"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button
                  className="h-11 w-full text-sm font-semibold"
                  type="submit"
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Sign in
                </Button>

                {isDev ? (
                  <div className="space-y-2 border-t pt-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Development quick fill
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmail("senior.manager@wfm.local");
                          setPassword("SeniorManager@123");
                          setError(null);
                        }}
                      >
                        Senior Manager
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmail("ra.es.ahmadpur-sial@wfm.local");
                          setPassword("RaEs@123");
                          setError(null);
                        }}
                      >
                        RA Tehsil
                      </Button>
                    </div>
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} PRMSC. All rights reserved.
        </p>
      </section>
    </main>
  );
}
