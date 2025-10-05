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

const MAX_TWEET = 280;
const MAX_HEADLINE = 70;

export default function XDashboard() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [existingTweets, setExistingTweets] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [context, setContext] = useState("");
  const [numTweets, setNumTweets] = useState<number>(5);
  const [numHeadlines, setNumHeadlines] = useState<number>(5);
  const [model, setModel] = useState<string>("google/gemini-2.5-flash");
  const [tweets, setTweets] = useState<string[]>([]);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"tweets" | "headlines">("tweets");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterLength, setFilterLength] = useState<"all" | "within" | "over">("all");

  const withinSpecStats = useMemo(() => {
    const tOk = tweets.filter((t) => t.length <= MAX_TWEET).length;
    const hOk = headlines.filter((h) => h.length <= MAX_HEADLINE).length;
    return { tOk, hOk, tTotal: tweets.length, hTotal: headlines.length };
  }, [tweets, headlines]);

  const generate = async () => {
    if (!user || !session) {
      toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: {
          platform: 'x',
          existingTweets,
          hashtags,
          audience,
          tone,
          context,
          numTweets,
          numHeadlines,
          model,
        }
      });

      if (error) throw new Error(error.message || 'Failed to generate ad copy');
      if (data.error) throw new Error(data.error);

      const { tweets: newTweets, headlines: newHeadlines } = data;
      setTweets(newTweets || []);
      setHeadlines(newHeadlines || []);

      toast({
        title: "Success!",
        description: `Generated ${newTweets?.length || 0} tweets and ${newHeadlines?.length || 0} headlines.`,
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
    setTweets([]);
    setHeadlines([]);
  };

  const copyAll = async () => {
    const payload = [
      "TWEETS:",
      ...tweets.map((t, i) => `${i + 1}. ${t}`),
      "",
      "HEADLINES:",
      ...headlines.map((h, i) => `${i + 1}. ${h}`),
    ].join("\n");
    await navigator.clipboard.writeText(payload);
    toast({ title: "Copied!", description: "All results copied to clipboard." });
  };

  const downloadCombinedCSV = () => {
    const rows = [
      ...tweets.map((t) => ({ type: "tweet", text: t, chars: t.length, within: t.length <= MAX_TWEET })),
      ...headlines.map((h) => ({ type: "headline", text: h, chars: h.length, within: h.length <= MAX_HEADLINE })),
    ];
    downloadCSV(rows, `x_ads_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadWorkbook = () => {
    downloadXLSX([
      { data: tweets, limit: MAX_TWEET, sheetName: "Tweets" },
      { data: headlines, limit: MAX_HEADLINE, sheetName: "Headlines" }
    ], `x_ads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const makeFilter = (type: "tweets" | "headlines") => {
    const texts = type === "tweets" ? tweets : headlines;
    const limit = type === "tweets" ? MAX_TWEET : MAX_HEADLINE;

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
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">X (Twitter) Ads Generator</h2>
            <p className="text-sm text-muted-foreground">Concise, engaging ad copy optimized for X</p>
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
                  <Label htmlFor="existingTweets">Existing Tweets</Label>
                  <Textarea
                    id="existingTweets"
                    placeholder="One per line"
                    className="h-36 resize-vertical"
                    value={existingTweets}
                    onChange={(e) => setExistingTweets(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtags to Include</Label>
                  <Input
                    id="hashtags"
                    placeholder="e.g. #Marketing #AI #GrowthHacking"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Textarea
                    id="audience"
                    placeholder="Interests, demographics, behavior"
                    className="h-24 resize-vertical"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Brand Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="witty">Witty</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Campaign Context</Label>
                  <Textarea
                    id="context"
                    placeholder="Goals, offers, key messages, etc."
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
                  <Label>Tweets</Label>
                  <Select value={String(numTweets)} onValueChange={(v) => setNumTweets(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 8, 10].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Headlines (for cards)</Label>
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
                    <Badge variant="outline">T: {withinSpecStats.tOk}/{withinSpecStats.tTotal} ≤{MAX_TWEET}</Badge>
                    <Badge variant="outline">H: {withinSpecStats.hOk}/{withinSpecStats.hTotal} ≤{MAX_HEADLINE}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tweets" onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="tweets">Tweets</TabsTrigger>
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

                  <TabsContent value="tweets" className="mt-4">
                    <div className="space-y-3">
                      {makeFilter("tweets").length === 0 && (
                        <p className="text-sm text-muted-foreground">No tweets to show.</p>
                      )}
                      {makeFilter("tweets").map(({ text, i: idx }) => (
                        <div key={idx} className="rounded-lg border p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <Textarea
                                value={text}
                                onChange={(e) => {
                                  const next = [...tweets];
                                  next[idx] = e.target.value;
                                  setTweets(next);
                                }}
                                className="min-h-20"
                                maxLength={350}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <ChipCounter value={text} limit={MAX_TWEET} />
                              <RowActions
                                onCopy={async () => { 
                                  await navigator.clipboard.writeText(text);
                                  toast({ title: "Copied!" });
                                }}
                                onDelete={() => setTweets(tweets.filter((_, i) => i !== idx))}
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
                                maxLength={100}
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
