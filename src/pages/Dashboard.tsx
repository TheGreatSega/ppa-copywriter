import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Download, Copy, RefreshCw, Trash2, Check } from "lucide-react";
import * as XLSX from "xlsx";

// --- Spec constants (RSA) ---
const MAX_HEADLINE = 30; // Google Ads RSA headline character limit
const MAX_DESCRIPTION = 90; // Google Ads RSA description character limit

// Helper: class merge
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Helper: trim to limit without cutting words hard (soft clamp)
const softClamp = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 10 ? slice.slice(0, lastSpace) : slice).trim();
};

// --- CSV / XLSX helpers ---
function downloadCSV(rows: { type: string; text: string; chars: number; within: boolean }[]) {
  const header = ["type", "text", "characters", "within_spec"];
  const csv = [header.join(",")]
    .concat(
      rows.map((r) =>
        [
          r.type,
          JSON.stringify(r.text),
          String(r.chars),
          r.within ? "true" : "false",
        ].join(",")
      )
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `rsa_ad_copy_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

function downloadXLSX(headlines: string[], descriptions: string[]) {
  const ws1 = XLSX.utils.aoa_to_sheet([
    ["Headline", "Characters", "Within Spec (≤30)"],
    ...headlines.map((h) => [h, h.length, h.length <= MAX_HEADLINE]),
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([
    ["Description", "Characters", "Within Spec (≤90)"],
    ...descriptions.map((d) => [d, d.length, d.length <= MAX_DESCRIPTION]),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "Headlines");
  XLSX.utils.book_append_sheet(wb, ws2, "Descriptions");
  XLSX.writeFile(wb, `rsa_ad_copy_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

const ChipCounter: React.FC<{ value: string; limit: number }> = ({ value, limit }) => {
  const len = value.length;
  const within = len <= limit;
  const near = len > Math.floor(limit * 0.9) && len <= limit;
  return (
    <Badge
      variant={within ? (near ? "secondary" : "default") : "destructive"}
      className={cn("text-xs", !within && "animate-pulse")}
      title={`Characters: ${len}/${limit}`}
    >
      {len}/{limit}
    </Badge>
  );
};

const RowActions: React.FC<{
  onCopy: () => void;
  onDelete?: () => void;
}> = ({ onCopy, onDelete }) => (
  <div className="flex items-center gap-1">
    <Button variant="ghost" size="icon" onClick={onCopy} title="Copy to clipboard">
      <Copy className="h-4 w-4" />
    </Button>
    {onDelete && (
      <Button variant="ghost" size="icon" onClick={onDelete} title="Remove row">
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  </div>
);



export default function Dashboard() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  // Inputs
  const [existingHeadlines, setExistingHeadlines] = useState("");
  const [existingDescriptions, setExistingDescriptions] = useState("");
  const [keywords, setKeywords] = useState("");
  const [context, setContext] = useState("");

  // Settings
  const [numHeadlines, setNumHeadlines] = useState<number>(10);
  const [numDescriptions, setNumDescriptions] = useState<number>(4);
  const [model, setModel] = useState<string>("gpt-5-2025-08-07");

  // Results
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  
  // Loading state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Filters
  const [activeTab, setActiveTab] = useState<"headlines" | "descriptions">("headlines");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterLength, setFilterLength] = useState<"all" | "within" | "over">("all");

  // Derived
  const existingHeadlinesList = useMemo(
    () => existingHeadlines.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [existingHeadlines]
  );
  const existingDescriptionsList = useMemo(
    () => existingDescriptions.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [existingDescriptions]
  );

  const withinSpecStats = useMemo(() => {
    const hOk = headlines.filter((h) => h.length <= MAX_HEADLINE).length;
    const dOk = descriptions.filter((d) => d.length <= MAX_DESCRIPTION).length;
    return { hOk, dOk, hTotal: headlines.length, dTotal: descriptions.length };
  }, [headlines, descriptions]);

  // --- Generation - calls secure edge function ---
  const generate = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate ad copy.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: {
          existingHeadlines,
          existingDescriptions,
          keywords,
          context,
          numHeadlines,
          numDescriptions,
          model,
          locale: 'en-GB' // Default to UK English for better ad copy
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate ad copy');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const { headlines: newHeadlines, descriptions: newDescriptions } = data;

      setHeadlines(newHeadlines || []);
      setDescriptions(newDescriptions || []);

      toast({
        title: "Success!",
        description: `Generated ${newHeadlines?.length || 0} headlines and ${newDescriptions?.length || 0} descriptions.`,
      });

    } catch (error: any) {
      console.error('Generation error:', error);
      
      let errorMessage = 'Failed to generate ad copy. Please try again.';
      
      if (error.message?.includes('rate limit')) {
        errorMessage = 'Daily rate limit exceeded (50 requests per day). Please try again tomorrow.';
      } else if (error.message?.includes('Authorization')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    setHeadlines([]);
    setDescriptions([]);
  };

  const copyAll = async () => {
    const payload = [
      "HEADLINES:",
      ...headlines.map((h, i) => `${i + 1}. ${h}`),
      "",
      "DESCRIPTIONS:",
      ...descriptions.map((d, i) => `${i + 1}. ${d}`),
    ].join("\n");
    await navigator.clipboard.writeText(payload);
  };

  const downloadCombinedCSV = () => {
    const rows = [
      ...headlines.map((h) => ({
        type: "headline",
        text: h,
        chars: h.length,
        within: h.length <= MAX_HEADLINE,
      })),
      ...descriptions.map((d) => ({
        type: "description",
        text: d,
        chars: d.length,
        within: d.length <= MAX_DESCRIPTION,
      })),
    ];
    downloadCSV(rows);
  };

  const downloadWorkbook = () => {
    downloadXLSX(headlines, descriptions);
  };

  // Filtering helpers
  const makeFilter = (type: "headlines" | "descriptions") => {
    const texts = type === "headlines" ? headlines : descriptions;

    return texts.map((text, i) => ({ text, i }))
      .filter(({ text }) => {
        if (filterSearch) {
          const s = filterSearch.toLowerCase();
          if (!text.toLowerCase().includes(s)) return false;
        }
        if (filterLength === "within" && ((type === "headlines" ? text.length <= MAX_HEADLINE : text.length <= MAX_DESCRIPTION) === false)) return false;
        if (filterLength === "over" && ((type === "headlines" ? text.length > MAX_HEADLINE : text.length > MAX_DESCRIPTION) === false)) return false;
        return true;
      });
  };

  const HeaderBar = (
    <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Google Ads Copy Generator</h1>
            <p className="text-xs text-muted-foreground">Create compliant, high-intent RSA headlines & descriptions faster.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={copyAll} title="Copy all results">
            <Copy className="mr-2 h-4 w-4" /> Copy All
          </Button>
          <Button variant="outline" onClick={downloadCombinedCSV} title="Download CSV">
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button onClick={downloadWorkbook} title="Download Excel workbook">
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {HeaderBar}

      <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Inputs & Settings */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">1) Provide Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="existingHeadlines">Existing Headlines</Label>
                    <Textarea
                      id="existingHeadlines"
                      placeholder="One headline per line"
                      className="h-36 resize-vertical"
                      value={existingHeadlines}
                      onChange={(e) => setExistingHeadlines(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Tip: Add your current best performers for reference.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="existingDescriptions">Existing Descriptions</Label>
                    <Textarea
                      id="existingDescriptions"
                      placeholder="One description per line"
                      className="h-36 resize-vertical"
                      value={existingDescriptions}
                      onChange={(e) => setExistingDescriptions(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Optional, but helps increase relevance.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords & Search Queries</Label>
                  <Textarea
                    id="keywords"
                    placeholder="e.g. car insurance quotes\n+cheap car insurance\n[best car insurance]"
                    className="h-28 resize-vertical"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Campaign / Product / Offer Context</Label>
                  <Textarea
                    id="context"
                    placeholder="What makes this offer compelling? USPs, region, promo, audience, tone, compliance notes, etc."
                    className="h-28 resize-vertical"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">2) Configure</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Headlines</Label>
                  <Select value={String(numHeadlines)} onValueChange={(v) => setNumHeadlines(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Headlines</SelectLabel>
                        {[3, 5, 8, 10, 12, 15, 20, 25, 30].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Descriptions</Label>
                  <Select value={String(numDescriptions)} onValueChange={(v) => setNumDescriptions(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Descriptions</SelectLabel>
                        {[2, 3, 4, 6, 8, 10, 12, 15, 20, 25, 30].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger><SelectValue placeholder="Select a model" /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>GPT-5 (Flagship Models)</SelectLabel>
                        <SelectItem value="gpt-5-2025-08-07">GPT-5 - Most Capable & Balanced</SelectItem>
                        <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 Mini - Fast & Cost-Efficient</SelectItem>
                        <SelectItem value="gpt-5-nano-2025-08-07">GPT-5 Nano - Fastest & Cheapest</SelectItem>
                        <SelectLabel className="mt-2">GPT-4 Series</SelectLabel>
                        <SelectItem value="gpt-4.5-2025-05-16">GPT-4.5 - Advanced Reasoning</SelectItem>
                        <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 - Reliable Performance</SelectItem>
                        <SelectLabel className="mt-2">Google Gemini</SelectLabel>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash - Balanced & Fast</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">GPT-5 models recommended for best quality. Gemini is faster but less precise.</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={generate} disabled={isGenerating}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} /> 
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button variant="ghost" onClick={clearAll} disabled={isGenerating}>
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Results */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">3) Results</CardTitle>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">H: {withinSpecStats.hOk}/{withinSpecStats.hTotal} ≤{MAX_HEADLINE}</Badge>
                    <Badge variant="outline">D: {withinSpecStats.dOk}/{withinSpecStats.dTotal} ≤{MAX_DESCRIPTION}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="headlines" className="w-full" onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="headlines">Headlines</TabsTrigger>
                    <TabsTrigger value="descriptions">Descriptions</TabsTrigger>
                  </TabsList>

                  {/* Filters */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Input placeholder="Search text…" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
                    </div>
                    <div>
                      <Select value={filterLength} onValueChange={(v) => setFilterLength(v as any)}>
                        <SelectTrigger><SelectValue placeholder="Length" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All lengths</SelectItem>
                          <SelectItem value="within">Within spec</SelectItem>
                          <SelectItem value="over">Over spec</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* HEADLINES TAB */}
                  <TabsContent value="headlines" className="mt-4">
                    <div className="space-y-3">
                      {makeFilter("headlines").length === 0 && (
                        <p className="text-sm text-muted-foreground">No headlines to show. Generate or adjust filters.</p>
                      )}
                      {makeFilter("headlines").map(({ text: h, i: idx }) => (
                        <div key={idx} className="rounded-lg border p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <Label className="sr-only">Headline {idx + 1}</Label>
                              <Input
                                value={h}
                                onChange={(e) => {
                                  const next = [...headlines];
                                  next[idx] = e.target.value;
                                  setHeadlines(next);
                                }}
                                maxLength={120}
                                placeholder={`Headline ${idx + 1}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <ChipCounter value={h} limit={MAX_HEADLINE} />
                              <RowActions
                                onCopy={async () => { await navigator.clipboard.writeText(h); }}
                                onDelete={() => {
                                  const nextH = headlines.filter((_, i) => i !== idx);
                                  setHeadlines(nextH);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* DESCRIPTIONS TAB */}
                  <TabsContent value="descriptions" className="mt-4">
                    <div className="space-y-3">
                      {makeFilter("descriptions").length === 0 && (
                        <p className="text-sm text-muted-foreground">No descriptions to show. Generate or adjust filters.</p>
                      )}
                      {makeFilter("descriptions").map(({ text: d, i: idx }) => (
                        <div key={idx} className="rounded-lg border p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <Label className="sr-only">Description {idx + 1}</Label>
                              <Textarea
                                value={d}
                                onChange={(e) => {
                                  const next = [...descriptions];
                                  next[idx] = e.target.value;
                                  setDescriptions(next);
                                }}
                                className="min-h-20"
                                maxLength={300}
                                placeholder={`Description ${idx + 1}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <ChipCounter value={d} limit={MAX_DESCRIPTION} />
                              <RowActions
                                onCopy={async () => { await navigator.clipboard.writeText(d); }}
                                onDelete={() => {
                                  const nextD = descriptions.filter((_, i) => i !== idx);
                                  setDescriptions(nextD);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Headlines ≤ {MAX_HEADLINE} chars</div>
                  <div className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Descriptions ≤ {MAX_DESCRIPTION} chars</div>
                  <div className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Filters: search / length</div>
                  <div className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Export CSV / Excel</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer helper card */}
        <div className="mt-6">
          <Card>
            <CardContent className="py-4 text-xs text-muted-foreground">
              <p>
                <strong>🚀 Enhanced AI System Active:</strong> Advanced prompt engineering with OpenAI GPT-4o/4.1 and Google Gemini 1.5 Pro. Features deduplication, variety optimization, UK English spelling, and professional RSA compliance validation.
              </p>
              <p>
                <strong>Security & Performance:</strong> JWT authentication, 50 req/day rate limiting, structured JSON responses, automatic character limit enforcement, and comprehensive error handling. All API keys secured in Supabase Edge Functions.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}