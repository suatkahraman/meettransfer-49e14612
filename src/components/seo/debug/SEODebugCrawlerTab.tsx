import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Globe, Code, Eye, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Common crawler user agents for testing
const CRAWLER_USER_AGENTS = {
  googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  facebookbot: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  twitterbot: "Twitterbot/1.0",
  linkedinbot: "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
  whatsapp: "WhatsApp/2.21.12.21 A",
  telegram: "TelegramBot (like TwitterBot)",
  slackbot: "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  discordbot: "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
  pinterest: "Pinterest/0.2 (+http://www.pinterest.com/)",
  lighthouse: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36 Lighthouse",
  pagespeed: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google Page Speed Insights) Chrome/91.0.4472.114 Safari/537.36",
  semrush: "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
  ahrefs: "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
  regular_chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  regular_firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
};

interface CrawlerTestResult {
  path: string;
  userAgent: string;
  isCrawler: boolean;
  responseTime: number;
  title?: string;
  description?: string;
  htmlPreview?: string;
  fullHtml?: string;
  error?: string;
  headers?: Record<string, string>;
}

export function SEODebugCrawlerTab() {
  const [testPath, setTestPath] = useState("/");
  const [selectedBot, setSelectedBot] = useState("googlebot");
  const [customUserAgent, setCustomUserAgent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrawlerTestResult | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");

  const runCrawlerTest = async () => {
    setIsLoading(true);
    setResult(null);

    const startTime = performance.now();
    const userAgent = customUserAgent || CRAWLER_USER_AGENTS[selectedBot as keyof typeof CRAWLER_USER_AGENTS];

    try {
      // Call the crawler-ssr edge function with force=true to simulate crawler
      const { data, error } = await supabase.functions.invoke("crawler-ssr", {
        body: {},
        headers: {
          "User-Agent": userAgent,
        },
      });

      // Also make a direct fetch with the path parameter
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crawler-ssr?path=${encodeURIComponent(testPath)}&force=true`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "User-Agent": userAgent,
          },
        }
      );

      const responseTime = performance.now() - startTime;
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = response.headers.get("content-type") || "";
      
      if (contentType.includes("text/html")) {
        const html = await response.text();
        
        // Extract title and description from HTML
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
        
        setResult({
          path: testPath,
          userAgent,
          isCrawler: true,
          responseTime,
          title: titleMatch ? titleMatch[1] : undefined,
          description: descMatch ? descMatch[1] : undefined,
          htmlPreview: html.substring(0, 2000),
          fullHtml: html,
          headers: responseHeaders,
        });
      } else {
        // JSON response (non-crawler)
        const json = await response.json();
        
        setResult({
          path: testPath,
          userAgent,
          isCrawler: json.isCrawler || false,
          responseTime,
          error: json.message,
          headers: responseHeaders,
        });
      }
    } catch (err) {
      const responseTime = performance.now() - startTime;
      setResult({
        path: testPath,
        userAgent,
        isCrawler: false,
        responseTime,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractMetaTags = (html: string): { name: string; content: string }[] => {
    const tags: { name: string; content: string }[] = [];
    const regex = /<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      tags.push({ name: match[1], content: match[2] });
    }
    return tags;
  };

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Crawler SSR Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Path</Label>
              <Input
                value={testPath}
                onChange={(e) => setTestPath(e.target.value)}
                placeholder="/"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Bot Type</Label>
              <Select value={selectedBot} onValueChange={setSelectedBot}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="googlebot">🔍 Googlebot</SelectItem>
                  <SelectItem value="bingbot">🔎 Bingbot</SelectItem>
                  <SelectItem value="facebookbot">📘 Facebook</SelectItem>
                  <SelectItem value="twitterbot">🐦 Twitter/X</SelectItem>
                  <SelectItem value="linkedinbot">💼 LinkedIn</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="telegram">✈️ Telegram</SelectItem>
                  <SelectItem value="slackbot">💼 Slack</SelectItem>
                  <SelectItem value="discordbot">🎮 Discord</SelectItem>
                  <SelectItem value="pinterest">📌 Pinterest</SelectItem>
                  <SelectItem value="lighthouse">🏠 Lighthouse</SelectItem>
                  <SelectItem value="pagespeed">⚡ PageSpeed</SelectItem>
                  <SelectItem value="semrush">📊 SEMrush</SelectItem>
                  <SelectItem value="ahrefs">🔗 Ahrefs</SelectItem>
                  <SelectItem value="regular_chrome">🌐 Chrome (Regular)</SelectItem>
                  <SelectItem value="regular_firefox">🦊 Firefox (Regular)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom User-Agent (optional)</Label>
            <Input
              value={customUserAgent}
              onChange={(e) => setCustomUserAgent(e.target.value)}
              placeholder="Leave empty to use selected bot's user-agent"
            />
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm font-mono break-all">
            <span className="text-muted-foreground">User-Agent: </span>
            {customUserAgent || CRAWLER_USER_AGENTS[selectedBot as keyof typeof CRAWLER_USER_AGENTS]}
          </div>

          <Button onClick={runCrawlerTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Run Crawler Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {result.isCrawler ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-500" />
                )}
                Test Result
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={result.isCrawler ? "default" : "secondary"}>
                  {result.isCrawler ? "SSR HTML" : "JSON Response"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {result.responseTime.toFixed(0)}ms
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                {result.error}
              </div>
            )}

            {result.isCrawler && result.fullHtml && (
              <>
                {/* SEO Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Title</Label>
                    <div className="p-3 bg-muted rounded-lg font-medium">
                      {result.title || "Not found"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      {result.description || "Not found"}
                    </div>
                  </div>
                </div>

                {/* Meta Tags */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Extracted Meta Tags</Label>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {extractMetaTags(result.fullHtml).map((tag, i) => (
                      <div key={i} className="flex gap-2 text-xs p-2 bg-muted rounded">
                        <Badge variant="outline" className="shrink-0">
                          {tag.name}
                        </Badge>
                        <span className="text-muted-foreground truncate">
                          {tag.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HTML View Toggle */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "preview" | "source")}>
                  <TabsList>
                    <TabsTrigger value="preview" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="source" className="flex items-center gap-1">
                      <Code className="h-4 w-4" />
                      Source
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="mt-4">
                    <div className="border rounded-lg overflow-hidden bg-background">
                      <iframe
                        srcDoc={result.fullHtml}
                        className="w-full h-96"
                        title="SSR Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="source" className="mt-4">
                    <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-96 text-xs font-mono whitespace-pre-wrap">
                      {result.fullHtml}
                    </pre>
                  </TabsContent>
                </Tabs>

                {/* Response Headers */}
                {result.headers && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Response Headers</Label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(result.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-2 p-2 bg-muted rounded">
                          <span className="font-medium">{key}:</span>
                          <span className="text-muted-foreground truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!result.isCrawler && !result.error && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-600 dark:text-yellow-400">
                  <Globe className="inline h-4 w-4 mr-2" />
                  This user-agent was not detected as a crawler. Regular SPA will be served.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["/", "/tr", "/ru", "/de", "/services", "/pricing", "/about"].map((path) => (
              <Button
                key={path}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTestPath(path);
                  setTimeout(() => runCrawlerTest(), 100);
                }}
                disabled={isLoading}
              >
                {path}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
