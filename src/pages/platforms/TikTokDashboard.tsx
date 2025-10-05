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
import { Badge } from "@/components/ui/badge";
import { Download, Copy, RefreshCw, Trash2 } from "lucide-react";
import { ChipCounter } from "@/components/shared/ChipCounter";
import { RowActions } from "@/components/shared/RowActions";
import { downloadCSV, downloadXLSX } from "@/lib/exportUtils";

const MAX_AD_TEXT = 100;

export default function TikTokDashboard() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [existingAdText, setExistingAdText] = useState("");
  const [videoTheme, setVideoTheme] = useState("");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("conversions");
  const [context, setContext] = useState("");
  const [numAdTexts, setNumAdTexts] = useState<number>(5);
  const [model, setModel] = useState<string>("google/gemini-2.5-flash");
  const [adTexts, setAdTexts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterLength, setFilterLength] = useState<"all" | "within" | "over">("all");

  const withinSpecStats = useMemo(() => {
    const aOk = adTexts.filter((a) => a.length <= MAX_AD_TEXT).length;
    return { aOk, aTotal: adTexts.length };
  }, [adTexts]);

  const generate = async () => {
    if (!user || !session) {
      toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: {
          platform: 'tiktok',
          existingAdText,
          videoTheme,
          audience,
          objective,
          context,
          numAdTexts,
          model,
        }
      });

      if (error) throw new Error(error.message || 'Failed to generate ad copy');
      if (data.error) throw new Error(data.error);

      const { adTexts: newAdTexts } = data;
      setAdTexts(newAdTexts || []);

      toast({
        title: "Success!",
        description: `Generated ${newAdTexts?.length || 0} ad texts.`,
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
    setAdTexts([]);
  };

  const copyAll = async () => {
    const payload = adTexts.map((a, i) => `${i + 1}. ${a}`).join("\n");
    await navigator.clipboard.writeText(payload);
    toast({ title: "Copied!", description: "All results copied to clipboard." });
  };

  const downloadCombinedCSV = () => {
    const rows = adTexts.map((a) => ({ 
      type: "ad_text", 
      text: a, 
      chars: a.length, 
      within: a.length <= MAX_AD_TEXT 
    }));
    downloadCSV(rows, `tiktok_ads_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadWorkbook = () => {
    downloadXLSX([
      { data: adTexts, limit: MAX_AD_TEXT, sheetName: "Ad Text" }
    ], `tiktok_ads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredAdTexts = useMemo(() => {
    return adTexts.map((text, i) => ({ text, i }))
      .filter(({ text }) => {
        if (filterSearch && !text.toLowerCase().includes(filterSearch.toLowerCase())) return false;
        if (filterLength === "within" && text.length > MAX_AD_TEXT) return false;
        if (filterLength === "over" && text.length <= MAX_AD_TEXT) return false;
        return true;
      });
  }, [adTexts, filterSearch, filterLength]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">TikTok Ads Generator</h2>
            <p className="text-sm text-muted-foreground">Engaging, trend-aware ad copy for TikTok</p>
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
                  <Label htmlFor="existingAdText">Existing Ad Text</Label>
                  <Textarea
                    id="existingAdText"
                    placeholder="One per line (appears above video)"
                    className="h-36 resize-vertical"
                    value={existingAdText}
                    onChange={(e) => setExistingAdText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoTheme">Video Concept/Theme</Label>
                  <Textarea
                    id="videoTheme"
                    placeholder="Describe the video content, style, mood"
                    className="h-28 resize-vertical"
                    value={videoTheme}
                    onChange={(e) => setVideoTheme(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Textarea
                    id="audience"
                    placeholder="Age range, interests, behaviors"
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
                      <SelectItem value="app_installs">App Installs</SelectItem>
                      <SelectItem value="traffic">Traffic</SelectItem>
                      <SelectItem value="conversions">Conversions</SelectItem>
                      <SelectItem value="video_views">Video Views</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Brand & Offer Context</Label>
                  <Textarea
                    id="context"
                    placeholder="Brand personality, offers, trends to reference"
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Number of Ad Texts</Label>
                  <Select value={String(numAdTexts)} onValueChange={(v) => setNumAdTexts(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 8, 10].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Google Gemini (Free)</SelectLabel>
                        <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>GPT-5 Series</SelectLabel>
                        <SelectItem value="gpt-5-2025-08-07">GPT-5 - Most Capable</SelectItem>
                        <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 Mini - Fast & Efficient</SelectItem>
                        <SelectItem value="gpt-5-nano-2025-08-07">GPT-5 Nano - Fastest</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>GPT-4 Series</SelectLabel>
                        <SelectItem value="gpt-4.5-2025-05-16">GPT-4.5 - Advanced Reasoning</SelectItem>
                        <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 - Reliable</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
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
                    <Badge variant="outline">
                      {withinSpecStats.aOk}/{withinSpecStats.aTotal} ≤{MAX_AD_TEXT}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
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

                <div className="space-y-3">
                  {filteredAdTexts.length === 0 && (
                    <p className="text-sm text-muted-foreground">No ad texts to show.</p>
                  )}
                  {filteredAdTexts.map(({ text, i: idx }) => (
                    <div key={idx} className="rounded-lg border p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <Textarea
                            value={text}
                            onChange={(e) => {
                              const next = [...adTexts];
                              next[idx] = e.target.value;
                              setAdTexts(next);
                            }}
                            className="min-h-20"
                            maxLength={200}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <ChipCounter value={text} limit={MAX_AD_TEXT} />
                          <RowActions
                            onCopy={async () => { 
                              await navigator.clipboard.writeText(text);
                              toast({ title: "Copied!" });
                            }}
                            onDelete={() => setAdTexts(adTexts.filter((_, i) => i !== idx))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
