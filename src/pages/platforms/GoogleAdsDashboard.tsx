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
import { Download, Copy, RefreshCw, Trash2, Check } from "lucide-react";
import { ChipCounter } from "@/components/shared/ChipCounter";
import { RowActions } from "@/components/shared/RowActions";
import { downloadCSV, downloadXLSX, softClamp } from "@/lib/exportUtils";

const MAX_HEADLINE = 30;
const MAX_DESCRIPTION = 90;

export default function GoogleAdsDashboard() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [existingHeadlines, setExistingHeadlines] = useState("");
  const [existingDescriptions, setExistingDescriptions] = useState("");
  const [keywords, setKeywords] = useState("");
  const [context, setContext] = useState("");
  const [numHeadlines, setNumHeadlines] = useState<number>(10);
  const [numDescriptions, setNumDescriptions] = useState<number>(4);
  const [model, setModel] = useState<string>("google/gemini-2.5-flash");
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"headlines" | "descriptions">("headlines");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterLength, setFilterLength] = useState<"all" | "within" | "over">("all");

  const withinSpecStats = useMemo(() => {
    const hOk = headlines.filter((h) => h.length <= MAX_HEADLINE).length;
    const dOk = descriptions.filter((d) => d.length <= MAX_DESCRIPTION).length;
    return { hOk, dOk, hTotal: headlines.length, dTotal: descriptions.length };
  }, [headlines, descriptions]);

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
          platform: 'google',
          existingHeadlines,
          existingDescriptions,
          keywords,
          context,
          numHeadlines,
          numDescriptions,
          model,
          locale: 'en-GB'
        }
      });

      if (error) throw new Error(error.message || 'Failed to generate ad copy');
      if (data.error) throw new Error(data.error);

      const { headlines: newHeadlines, descriptions: newDescriptions } = data;
      setHeadlines(newHeadlines || []);
      setDescriptions(newDescriptions || []);

      toast({
        title: "Success!",
        description: `Generated ${newHeadlines?.length || 0} headlines and ${newDescriptions?.length || 0} descriptions.`,
      });

    } catch (error: any) {
      let errorMessage = 'Failed to generate ad copy. Please try again.';
      
      if (error.message?.includes('rate limit')) {
        errorMessage = 'Daily rate limit exceeded. Please try again tomorrow.';
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
    toast({ title: "Copied!", description: "All results copied to clipboard." });
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
    downloadCSV(rows, `google_ads_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadWorkbook = () => {
    downloadXLSX([
      { data: headlines, limit: MAX_HEADLINE, sheetName: "Headlines" },
      { data: descriptions, limit: MAX_DESCRIPTION, sheetName: "Descriptions" }
    ], `google_ads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const makeFilter = (type: "headlines" | "descriptions") => {
    const texts = type === "headlines" ? headlines : descriptions;
    const limit = type === "headlines" ? MAX_HEADLINE : MAX_DESCRIPTION;

    return texts.map((text, i) => ({ text, i }))
      .filter(({ text }) => {
        if (filterSearch && !text.toLowerCase().includes(filterSearch.toLowerCase())) return false;
        if (filterLength === "within" && text.length > limit) return false;
        if (filterLength === "over" && text.length <= limit) return false;
        return true;
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        {/* Header Actions */}
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">Google Ads RSA Generator</h2>
            <p className="text-sm text-muted-foreground">Create compliant, high-intent headlines & descriptions</p>
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
          {/* Left: Inputs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="existingHeadlines">Existing Headlines</Label>
                    <Textarea
                      id="existingHeadlines"
                      placeholder="One per line"
                      className="h-36 resize-vertical"
                      value={existingHeadlines}
                      onChange={(e) => setExistingHeadlines(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="existingDescriptions">Existing Descriptions</Label>
                    <Textarea
                      id="existingDescriptions"
                      placeholder="One per line"
                      className="h-36 resize-vertical"
                      value={existingDescriptions}
                      onChange={(e) => setExistingDescriptions(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords & Search Queries</Label>
                  <Textarea
                    id="keywords"
                    placeholder="e.g. car insurance quotes"
                    className="h-28 resize-vertical"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Campaign Context</Label>
                  <Textarea
                    id="context"
                    placeholder="USPs, region, promo, audience, tone, etc."
                    className="h-28 resize-vertical"
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
                  <Label>Headlines</Label>
                  <Select value={String(numHeadlines)} onValueChange={(v) => setNumHeadlines(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 8, 10, 12, 15].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descriptions</Label>
                  <Select value={String(numDescriptions)} onValueChange={(v) => setNumDescriptions(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 6, 8, 10].map((n) => (
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
                        <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash - Balanced & Fast</SelectItem>
                        <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro - Most Capable</SelectItem>
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

          {/* Right: Results */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Results</CardTitle>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">H: {withinSpecStats.hOk}/{withinSpecStats.hTotal} ≤{MAX_HEADLINE}</Badge>
                    <Badge variant="outline">D: {withinSpecStats.dOk}/{withinSpecStats.dTotal} ≤{MAX_DESCRIPTION}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="headlines" onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="headlines">Headlines</TabsTrigger>
                    <TabsTrigger value="descriptions">Descriptions</TabsTrigger>
                  </TabsList>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Search text…" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
                    <Select value={filterLength} onValueChange={(v) => setFilterLength(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All lengths</SelectItem>
                        <SelectItem value="within">Within spec</SelectItem>
                        <SelectItem value="over">Over spec</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                                maxLength={120}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <ChipCounter value={text} limit={MAX_HEADLINE} />
                              <RowActions
                                onCopy={async () => { 
                                  await navigator.clipboard.writeText(text);
                                  toast({ title: "Copied!", description: "Headline copied to clipboard." });
                                }}
                                onDelete={() => setHeadlines(headlines.filter((_, i) => i !== idx))}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="descriptions" className="mt-4">
                    <div className="space-y-3">
                      {makeFilter("descriptions").length === 0 && (
                        <p className="text-sm text-muted-foreground">No descriptions to show.</p>
                      )}
                      {makeFilter("descriptions").map(({ text, i: idx }) => (
                        <div key={idx} className="rounded-lg border p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <Textarea
                                value={text}
                                onChange={(e) => {
                                  const next = [...descriptions];
                                  next[idx] = e.target.value;
                                  setDescriptions(next);
                                }}
                                className="min-h-20"
                                maxLength={300}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <ChipCounter value={text} limit={MAX_DESCRIPTION} />
                              <RowActions
                                onCopy={async () => { 
                                  await navigator.clipboard.writeText(text);
                                  toast({ title: "Copied!", description: "Description copied to clipboard." });
                                }}
                                onDelete={() => setDescriptions(descriptions.filter((_, i) => i !== idx))}
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
