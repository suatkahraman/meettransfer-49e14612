import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, RefreshCw, WifiOff } from "lucide-react";

type ProbeResult = {
  label: string;
  url: string;
  ok: boolean;
  status: number | null;
  statusText?: string;
  error?: string;
  durationMs: number;
};

function maskKey(key: string) {
  const k = key.trim();
  if (k.length <= 12) return "(hidden)";
  return `${k.slice(0, 6)}…${k.slice(-6)}`;
}

async function probe(url: string, init?: RequestInit): Promise<Omit<ProbeResult, "label">> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      // Explicitly keep this a real CORS request (default is "cors" in browsers)
      cache: "no-store",
      ...init,
    });

    const durationMs = Math.round(performance.now() - start);
    return {
      url,
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs,
    };
  } catch (e: any) {
    const durationMs = Math.round(performance.now() - start);
    return {
      url,
      ok: false,
      status: null,
      error: e?.message || String(e),
      durationMs,
    };
  }
}

export function AuthConnectivityPanel() {
  const [results, setResults] = useState<ProbeResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const env = useMemo(() => {
    const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
    const rawKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";

    const urlTrimmed = rawUrl.trim();
    const keyTrimmed = rawKey.trim();

    let parsedHost: string | null = null;
    let parsedOrigin: string | null = null;
    try {
      const u = new URL(urlTrimmed);
      parsedHost = u.hostname;
      parsedOrigin = u.origin;
    } catch {
      // ignore
    }

    return {
      rawUrl,
      rawKey,
      urlTrimmed,
      keyTrimmed,
      parsedHost,
      parsedOrigin,
      origin: window.location.origin,
      urlHasWhitespace: rawUrl !== urlTrimmed,
      keyHasWhitespace: rawKey !== keyTrimmed,
      urlValid: Boolean(parsedOrigin),
      keyPresent: keyTrimmed.length > 0,
    };
  }, []);

  const run = useCallback(async () => {
    setIsRunning(true);
    try {
      if (!env.urlValid || !env.keyPresent || !env.parsedOrigin) {
        setResults([
          {
            label: "ENV Check",
            url: "(n/a)",
            ok: false,
            status: null,
            error: "Backend URL veya Publishable Key eksik/geçersiz görünüyor.",
            durationMs: 0,
          },
        ]);
        return;
      }

      const base = env.parsedOrigin;
      const headers = {
        apikey: env.keyTrimmed,
        authorization: `Bearer ${env.keyTrimmed}`,
      } as Record<string, string>;

      const probes: Array<{ label: string; url: string; init?: RequestInit }> = [
        {
          label: "REST (reachability)",
          url: `${base}/rest/v1/`,
          init: { method: "GET", headers },
        },
        {
          label: "Auth settings (CORS check)",
          url: `${base}/auth/v1/settings`,
          init: { method: "GET", headers },
        },
      ];

      const settled = await Promise.all(
        probes.map(async (p) => {
          const r = await probe(p.url, p.init);
          return { label: p.label, ...r };
        }),
      );

      setResults(settled);
    } finally {
      setIsRunning(false);
    }
  }, [env.keyPresent, env.keyTrimmed, env.parsedOrigin, env.urlValid]);

  const hasFailedFetch = results?.some((r) => (r.error || "").toLowerCase().includes("failed to fetch")) ?? false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {hasFailedFetch ? (
            <WifiOff className="h-5 w-5 text-destructive" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          )}
          Backend / Auth Bağlantı Testi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Uygulama Origin:</span>
            <Badge variant="outline">{env.origin}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Backend Host:</span>
            <Badge variant={env.urlValid ? "outline" : "destructive"}>
              {env.parsedHost ?? "(geçersiz URL)"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Publishable Key:</span>
            <Badge variant={env.keyPresent ? "outline" : "destructive"}>{maskKey(env.keyTrimmed)}</Badge>
          </div>
          {(env.urlHasWhitespace || env.keyHasWhitespace) && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">ENV boşluk uyarısı</div>
                <div className="text-muted-foreground">
                  URL veya key başında/sonunda boşluk var. Bu, bazı ortamlarda isteklerin “Failed to fetch” ile düşmesine neden olabilir.
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={run} disabled={isRunning}>
            <RefreshCw className={isRunning ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {isRunning ? "Test ediliyor…" : "Test Et"}
          </Button>
        </div>

        {results && (
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.label}
                className="rounded-xl border bg-card p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{r.label}</div>
                  {r.status !== null ? (
                    <Badge variant={r.ok ? "outline" : "secondary"}>
                      {r.status} {r.statusText || ""} • {r.durationMs}ms
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Fetch Hatası • {r.durationMs}ms</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground break-all">{r.url}</div>
                {r.error && (
                  <div className="text-xs text-destructive break-words">{r.error}</div>
                )}
              </div>
            ))}

            {hasFailedFetch && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs">
                <div className="font-medium text-destructive">Bu hata genelde CORS / URL allowlist kaynaklıdır.</div>
                <div className="mt-1 text-muted-foreground">
                  Lovable Cloud &gt; Authentication Settings &gt; URL Configuration bölümünde:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Site URL: <code>{env.origin}</code></li>
                    <li>Redirect URLs listesine: <code>{env.origin}/oauth/callback</code> (ve preview için <code>https://*.lovable.app/*</code>)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
