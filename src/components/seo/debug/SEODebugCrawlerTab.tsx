import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bot, Clock, CheckCircle, XCircle, Code, Eye, Loader2, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const CRAWLER_USER_AGENTS = {
  googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  facebookbot: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  twitterbot: "Twitterbot/1.0",
  linkedinbot: "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
  slackbot: "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  telegrambot: "TelegramBot (like TwitterBot)",
  whatsapp: "WhatsApp/2.21.12.21 A",
  pinterest: "Pinterest/0.2 (+https://www.pinterest.com/bot.html)",
  yandexbot: "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
  baidubot: "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
  duckduckbot: "DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)",
  applebot: "Applebot/0.1 (+http://www.apple.com/go/applebot)",
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
};

interface CrawlerTestResult {
  path: string;
  userAgent: string;
  isCrawler: boolean;
  responseTime: number;
  html?: string;
  seoData?: {
    title?: string;
    description?: string;
    metaTags?: Array<{ name: string; content: string }>;
  };
  headers?: Record<string, string>;
  error?: string;
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
      // Make a direct fetch with the path parameter - handle as text, not JSON
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

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Get content type to determine how to parse
      const contentType = response.headers.get("content-type") || "";
      
      // Get response headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Check if it's a crawler response (HTML) or regular response (JSON)
      if (contentType.includes("text/html")) {
        // It's an HTML response - crawler was detected
        const html = await response.text();
        
        // Extract SEO data from HTML
        const seoData = extractMetaTags(html);

        setResult({
          path: testPath,
          userAgent,
          isCrawler: true,
          responseTime,
          html,
          seoData,
          headers,
        });
      } else if (contentType.includes("application/json")) {
        // It's a JSON response - not detected as crawler
        const jsonData = await response.json();
        
        setResult({
          path: testPath,
          userAgent,
          isCrawler: false,
          responseTime,
          headers,
          error: jsonData.message || "User-Agent was not detected as a crawler",
        });
      } else {
        // Unknown content type - try to read as text
        const text = await response.text();
        
        // Check if it looks like HTML
        if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
          const seoData = extractMetaTags(text);
          setResult({
            path: testPath,
            userAgent,
            isCrawler: true,
            responseTime,
            html: text,
            seoData,
            headers,
          });
        } else {
          setResult({
            path: testPath,
            userAgent,
            isCrawler: false,
            responseTime,
            headers,
            error: `Unexpected response type: ${contentType}`,
          });
        }
      }
    } catch (error) {
      const endTime = performance.now();
      setResult({
        path: testPath,
        userAgent,
        isCrawler: false,
        responseTime: Math.round(endTime - startTime),
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractMetaTags = (html: string): CrawlerTestResult["seoData"] => {
    const seoData: CrawlerTestResult["seoData"] = {
      metaTags: [],
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) {
      seoData.title = titleMatch[1].trim();
    }

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    if (descMatch) {
      seoData.description = descMatch[1].trim();
    }

    // Extract all meta tags
    const metaRegex = /<meta[^>]*(?:name|property)=["']([^"']*)["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']([^"']*)["'][^>]*>/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      const name = match[1] || match[4];
      const content = match[2] || match[3];
      if (name && content) {
        seoData.metaTags?.push({ name, content });
      }
    }

    return seoData;
  };

  const quickTestPaths = ["/", "/tr", "/ru", "/de", "/services", "/pricing", "/about"];

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Crawler SSR Test
          </CardTitle>
          <CardDescription>
            Test how the crawler-ssr edge function renders pages for different bots
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Path */}
          <div className="space-y-2">
            <Label htmlFor="testPath">Test Path</Label>
            <Input
              id="testPath"
              value={testPath}
              onChange={(e) => setTestPath(e.target.value)}
              placeholder="/"
            />
          </div>

          {/* Bot Selection */}
          <div className="space-y-2">
            <Label>Bot Type</Label>
            <Select value={selectedBot} onValueChange={setSelectedBot}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="googlebot">🔍 Googlebot</SelectItem>
                <SelectItem value="bingbot">🔍 Bingbot</SelectItem>
                <SelectItem value="facebookbot">📘 Facebook</SelectItem>
                <SelectItem value="twitterbot">🐦 Twitter</SelectItem>
                <SelectItem value="linkedinbot">💼 LinkedIn</SelectItem>
                <SelectItem value="slackbot">💬 Slack</SelectItem>
                <SelectItem value="telegrambot">✈️ Telegram</SelectItem>
                <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                <SelectItem value="pinterest">📌 Pinterest</SelectItem>
                <SelectItem value="yandexbot">🔍 Yandex</SelectItem>
                <SelectItem value="baidubot">🔍 Baidu</SelectItem>
                <SelectItem value="duckduckbot">🦆 DuckDuckGo</SelectItem>
                <SelectItem value="applebot">🍎 Applebot</SelectItem>
                <SelectItem value="chrome">🌐 Chrome (Regular)</SelectItem>
                <SelectItem value="firefox">🦊 Firefox (Regular)</SelectItem>
                <SelectItem value="safari">🧭 Safari (Regular)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom User Agent */}
          <div className="space-y-2">
            <Label htmlFor="customUA">Custom User-Agent (optional)</Label>
            <Input
              id="customUA"
              value={customUserAgent}
              onChange={(e) => setCustomUserAgent(e.target.value)}
              placeholder="Leave empty to use selected bot's user-agent"
            />
          </div>

          {/* Current User Agent Display */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <span className="text-muted-foreground">User-Agent: </span>
            <span className="font-mono text-xs break-all">
              {customUserAgent || CRAWLER_USER_AGENTS[selectedBot as keyof typeof CRAWLER_USER_AGENTS]}
            </span>
          </div>

          {/* Run Test Button */}
          <Button 
            onClick={runCrawlerTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Run Crawler Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.error ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              Test Result
              <Badge variant={result.isCrawler ? "default" : "secondary"}>
                {result.isCrawler ? "Crawler Detected" : "JSON Response"}
              </Badge>
              <Badge variant="outline" className="ml-auto">
                <Clock className="h-3 w-3 mr-1" />
                {result.responseTime}ms
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.error ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {result.error}
              </div>
            ) : result.isCrawler && result.seoData ? (
              <>
                {/* SEO Data */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Title</Label>
                    <p className="font-medium">{result.seoData.title || "No title found"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm">{result.seoData.description || "No description found"}</p>
                  </div>
                  
                  {/* Meta Tags */}
                  {result.seoData.metaTags && result.seoData.metaTags.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground mb-2 block">Meta Tags ({result.seoData.metaTags.length})</Label>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-1">
                          {result.seoData.metaTags.map((tag, index) => (
                            <div key={index} className="text-xs font-mono p-2 bg-muted rounded flex gap-2">
                              <Badge variant="outline" className="shrink-0">{tag.name}</Badge>
                              <span className="text-muted-foreground truncate">{tag.content}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                {/* HTML View */}
                <div className="border-t pt-4">
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "preview" | "source")}>
                    <TabsList>
                      <TabsTrigger value="preview">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="source">
                        <Code className="h-4 w-4 mr-1" />
                        Source
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview" className="mt-4">
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <iframe
                          srcDoc={result.html}
                          className="w-full h-[400px]"
                          title="SSR Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="source" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        <pre className="text-xs font-mono p-4 bg-muted rounded-lg whitespace-pre-wrap break-all">
                          {result.html}
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Response Headers */}
                {result.headers && Object.keys(result.headers).length > 0 && (
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground mb-2 block">Response Headers</Label>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-1">
                        {Object.entries(result.headers).map(([key, value]) => (
                          <div key={key} className="text-xs font-mono p-2 bg-muted rounded flex gap-2">
                            <Badge variant="outline" className="shrink-0">{key}</Badge>
                            <span className="text-muted-foreground truncate">{value}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  The user-agent was not detected as a crawler. The server would serve the regular SPA.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Quick Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickTestPaths.map((path) => (
              <Button
                key={path}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTestPath(path);
                }}
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
