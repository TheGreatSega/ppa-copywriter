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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, RefreshCw, Trash2 } from "lucide-react";
import { ChipCounter } from "@/components/shared/ChipCounter";
import { RowActions } from "@/components/shared/RowActions";
import { downloadCSV, downloadXLSX } from "@/lib/exportUtils";

const MAX_PRIMARY_TEXT = 125;
const MAX_HEADLINE = 27;
const MAX_DESCRIPTION = 27;

export default function MetaDashboard() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [existingPrimaryText, setExistingPrimaryText] = useState("");
  const [existingHeadlines, setExistingHeadlines] = useState("");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("conversions");
  const [context, setContext] = useState("");
  const [numPrimaryText, setNumPrimaryText] = useState<number>(5);
  const [numHeadlines, setNumHeadlines] = useState<number>(5);
  const [model, setModel] = useState<string>("google/gemini-2.5-flash");
  const [primaryTexts, setPrimaryTexts] = useState<string[]>([]);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"primary" | "headlines">("primary");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterLength, setFilterLength] = useState<"all" | "within" | "over">("all");

  const withinSpecStats = useMemo(() => {
    const pOk = primaryTexts.filter((p) => p.length <= MAX_PRIMARY_TEXT).length;
    const hOk = headlines.filter((h) => h.length <= MAX_HEADLINE).length;
    return { pOk, hOk, pTotal: primaryTexts.length, hTotal: headlines.length };
  }, [primaryTexts, headlines]);

  const generate = async () => {
    if (!user || !session) {
      toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: {
          platform: 'meta',
          existingPrimaryText,
          existingHeadlines,
          audience,
          objective,
          context,
          numPrimaryText,
          numHeadlines,
          model,
        }
      });

      if (error) throw new Error(error.message || 'Failed to generate ad copy');
      if (data.error) throw new Error(data.error);

      const { primaryTexts: newPrimary, headlines: newHeadlines } = data;
      setPrimaryTexts(newPrimary || []);
      setHeadlines(newHeadlines || []);

      toast({
        title: "Success!",
        description: `Generated ${newPrimary?.length || 0} primary texts and ${newHeadlines?.length || 0} headlines.`,
      });

    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to generate ad copy.',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    setPrimaryTexts([]);
    setHeadlines([]);
  };

  const copyAll = async () => {
    const payload = [
      "PRIMARY TEXT:",
      ...primaryTexts.map((p, i) => `${i + 1}. ${p}`),
      "",
      "HEADLINES:",
      ...headlines.map((h, i) => `${i + 1}. ${h}`),
    ].join("\n");
    await navigator.clipboard.writeText(payload);
    toast({ title: "Copied!", description: "All results copied to clipboard." });
  };

  const downloadCombinedCSV = () => {
    const rows = [
      ...primaryTexts.map((p) => ({ type: "primary_text", text: p, chars: p.length, within: p.length <= MAX_PRIMARY_TEXT })),
      ...headlines.map((h) => ({ type: "headline", text: h, chars: h.length, within: h.length <= MAX_HEADLINE })),
    ];
    downloadCSV(rows, `meta_ads_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadWorkbook = () => {
    downloadXLSX([
      { data: primaryTexts, limit: MAX_PRIMARY_TEXT, sheetName: "Primary Text" },
      { data: headlines, limit: MAX_HEADLINE, sheetName: "Headlines" }
    ], `meta_ads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const makeFilter = (type: "primary" | "headlines") => {
    const texts = type === "primary" ? primaryTexts : headlines;
    const limit = type === "primary" ? MAX_PRIMARY_TEXT : MAX_HEADLINE;

    return texts.map((text, i) => ({ text, i }))
      .filter(({ text }) => {
        if (filterSearch && !text.toLowerCase().includes(filterSearch.toLowerCase())) return false;
        if (filterLength === "within" && text.length > limit) return false;
        if (filterLength === "over" && text.length <= limit) return false;
        return true;
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">Meta Ads Generator</h2>
            <p className="text-sm text-muted-foreground">Facebook & Instagram ad copy optimized for social engagement</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="mr-2 h-4 w-4" /> Copy All
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCombinedCSV}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button size="sm" onClick={downloadWorkbook}>
              <Download className="mr-2 h-4 w-4" /> Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="existingPrimaryText">Existing Primary Text</Label>
                  <Textarea
                    id="existingPrimaryText"
                    placeholder="One per line (appears above the ad)"
                    className="h-36 resize-vertical"
                    value={existingPrimaryText}
                    onChange={(e) => setExistingPrimaryText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="existingHeadlines">Existing Headlines</Label>
                  <Textarea
                    id="existingHeadlines"
                    placeholder="One per line (appears below the creative)"
                    className="h-28 resize-vertical"
                    value={existingHeadlines}
                    onChange={(e) => setExistingHeadlines(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Textarea
                    id="audience"
                    placeholder="Demographics, interests, behaviors, etc."
                    className="h-24 resize-vertical"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective">Campaign Objective</Label>
                  <Select value={objective} onValueChange={setObjective}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="consideration">Consideration</SelectItem>
                      <SelectItem value="conversions">Conversions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Brand & Offer Context</Label>
                  <Textarea
                    id="context"
                    placeholder="USPs, tone, promo details, etc."
                    className="h-24 resize-vertical"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Texts</Label>
                  <Select value={String(numPrimaryText)} onValueChange={(v) => setNumPrimaryText(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 8, 10].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Headlines</Label>
                  <Select value={String(numHeadlines)} onValueChange={(v) => setNumHeadlines(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 8, 10].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>AI Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Google Gemini (Free)</SelectLabel>
                        <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <Button onClick={generate} disabled={isGenerating}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} /> 
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button variant="ghost" onClick={clearAll}>
                    <Trash2 className="mr-2 h-4 w-4" /> Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Results</CardTitle>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">PT: {withinSpecStats.pOk}/{withinSpecStats.pTotal} ≤{MAX_PRIMARY_TEXT}</Badge>
                    <Badge variant="outline">H: {withinSpecStats.hOk}/{withinSpecStats.hTotal} ≤{MAX_HEADLINE}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="primary" onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="primary">Primary Text</TabsTrigger>
                    <TabsTrigger value="headlines">Headlines</TabsTrigger>
                  </TabsList>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Search…" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
                    <Select value={filterLength} onValueChange={(v) => setFilterLength(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All lengths</SelectItem>
                        <SelectItem value="within">Within spec</SelectItem>
                        <SelectItem value="over">Over spec</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <TabsContent value="primary" className="mt-4">
                    <div className="space-y-3">
                      {makeFilter("primary").length === 0 && (
                        <p className="text-sm text-muted-foreground">No primary texts to show.</p>
                      )}
                      {makeFilter("primary").map(({ text, i: idx }) => (
                        <div key={idx} className="rounded-lg border p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <Textarea
                                value={text}
                                onChange={(e) => {
                                  const next = [...primaryTexts];
                                  next[idx] = e.target.value;
                                  setPrimaryTexts(next);
                                }}
                                className="min-h-20"
                                maxLength={250}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <ChipCounter value={text} limit={MAX_PRIMARY_TEXT} />
                              <RowActions
                                onCopy={async () => { 
                                  await navigator.clipboard.writeText(text);
                                  toast({ title: "Copied!" });
                                }}
                                onDelete={() => setPrimaryTexts(primaryTexts.filter((_, i) => i !== idx))}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="headlines" className="mt-4">
                    <div className="space-y-3">
                      {makeFilter("headlines").length === 0 && (
                        <p className="text-sm text-muted-foreground">No headlines to show.</p>
                      )}
                      {makeFilter("headlines").map(({ text, i: idx }) => (
                        <div key={idx} className="rounded-lg border p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <Input
                                value={text}
                                onChange={(e) => {
                                  const next = [...headlines];
                                  next[idx] = e.target.value;
                                  setHeadlines(next);
                                }}
                                maxLength={60}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <ChipCounter value={text} limit={MAX_HEADLINE} />
                              <RowActions
                                onCopy={async () => { 
                                  await navigator.clipboard.writeText(text);
                                  toast({ title: "Copied!" });
                                }}
                                onDelete={() => setHeadlines(headlines.filter((_, i) => i !== idx))}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
