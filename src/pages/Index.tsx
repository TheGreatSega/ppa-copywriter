import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* HEADER */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-lg font-bold">AdCopy AI</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#benefits" className="text-sm font-medium hover:underline">Product</a>
            <a href="#features" className="text-sm font-medium hover:underline">Solutions</a>
            <a href="#pricing" className="text-sm font-medium hover:underline">Pricing</a>
            <a href="#faq" className="text-sm font-medium hover:underline">Resources</a>
          </nav>
          <div className="flex gap-2">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="secondary" asChild className="hidden sm:inline-flex">
                  <Link to="/auth?tab=signin">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?tab=signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="w-full bg-[hsl(var(--hero-blue))] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6 order-1 lg:order-1"
            >
              <Badge className="bg-white text-[hsl(var(--hero-blue))] hover:bg-white">NEW</Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                Bold, high‑converting ad copy. <span className="opacity-90">On demand.</span>
              </h1>
              <p className="text-lg sm:text-xl opacity-95">
                AdcopyAI helps performance marketers generate compliant, scroll‑stopping Meta & Google Ads in seconds—guided by your product data and past winners.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" className="h-12 px-6 text-base bg-white text-[hsl(var(--hero-blue))] hover:bg-white/90" asChild>
                  <Link to="/auth?tab=signup">
                    Try Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-2 text-sm opacity-95">
                <div className="flex items-center gap-2"><Zap className="h-4 w-4"/>10x faster</div>
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4"/>Brand-safe</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4"/>Team-ready</div>
              </div>
            </motion.div>

            {/* Right: Mockups */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-2"
            >
              <div className="relative">
                <div className="absolute -inset-6 rounded-3xl bg-white/10 blur-xl" />
                <div className="relative rounded-3xl border border-white/20 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-[16/10] rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                      <img
                        src="/mockups/dashboard-left.png"
                        alt="AdcopyAI dashboard mockup"
                        className="h-full w-full object-cover rounded-xl"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="aspect-[16/10] rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                      <img
                        src="/mockups/dashboard-mobile.png"
                        alt="AdcopyAI mobile mockup"
                        className="h-full w-full object-cover rounded-xl"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="w-full bg-[hsl(var(--light-blue-bg))]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Benefits</h2>
            <p className="text-lg text-muted-foreground">Immediate wins you can feel in your KPIs.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Ship ads 10x faster",
                desc: "Generate 30+ on‑brand variations for Google, Meta, X, and TikTok in seconds—then export instantly.",
              },
              {
                title: "Platform-specific formats",
                desc: "Exact character limits for Google RSA (30/90), Meta placements, X (280), and TikTok (100).",
              },
              {
                title: "Multiple AI models",
                desc: "Choose between OpenAI GPT-5/4o and Google Gemini models for speed or quality.",
              },
              {
                title: "Edit & export instantly",
                desc: "Inline editing, CSV/Excel export, real-time character validation—ready to upload.",
              },
            ].map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-[hsl(var(--hero-blue))]" /> {b.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="w-full bg-[hsl(var(--mint-green-bg))] text-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Features</h2>
            <p className="text-lg">Everything you need to go from brief to live ads—fast.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Multi-platform generation",
                desc: "Google Ads RSA, Meta (6 placement types), X tweets, TikTok captions—all in one tool.",
              },
              {
                title: "Model selection",
                desc: "Access latest OpenAI (GPT-5, GPT-4o, GPT-4o-mini) and Google (Gemini 2.0 Flash, 1.5 Pro/Flash) models.",
              },
              {
                title: "Character limit enforcement",
                desc: "Platform-aware validation, real-time counters, and color-coded badges for compliance.",
              },
              {
                title: "Inline editing",
                desc: "Edit generated copy directly, duplicate variations, delete unwanted options—no copy/paste.",
              },
              {
                title: "Export flexibility",
                desc: "Download as CSV or Excel with proper formatting for platform upload to Ads Manager.",
              },
              {
                title: "Context-aware prompts",
                desc: "Input product context, audience, tone, keywords, and existing assets to guide generation.",
              },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <Card className="rounded-2xl bg-[hsl(var(--dark-card))] text-white h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white font-bold text-lg">
                      <Check className="h-5 w-5 text-white" /> {f.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="w-full bg-[hsl(var(--light-green-bg))]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="mb-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Pricing</h2>
            <p className="text-lg text-muted-foreground">Simple, transparent plans.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
            {[
              {
                name: "Monthly",
                price: "£4.99",
                note: "/ month",
                features: [
                  "All features included",
                  "Unlimited generations",
                  "Meta & Google templates",
                  "X & TikTok support",
                  "Export to CSV/Excel",
                ],
                cta: "Try Now",
                highlight: true,
              },
              {
                name: "Yearly",
                price: "£49.99",
                note: "/ year",
                features: [
                  "All features included",
                  "Unlimited generations",
                  "All platform templates",
                  "Priority support",
                  "Save over 15%",
                ],
                cta: "Try Now",
                highlight: false,
              },
            ].map((tier, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card
                  className={
                    "rounded-2xl shadow-md transition-all hover:shadow-lg " +
                    (tier.highlight ? " border-2 border-[hsl(var(--emerald))]" : "")
                  }
                >
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-extrabold">{tier.name}</CardTitle>
                    <div className="mt-2 flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-black">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.note}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {tier.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-foreground">
                          <Check className="mt-1 h-4 w-4 text-[hsl(var(--emerald))]" /> {feat}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={
                        "w-full h-11 text-base " +
                        (tier.highlight
                          ? "bg-[hsl(var(--hero-blue))] hover:bg-[hsl(var(--hero-blue))]/90 text-white"
                          : "bg-[hsl(var(--dark-card))] text-white hover:bg-[hsl(var(--dark-card))]/90")
                      }
                      asChild
                    >
                      <Link to="/auth?tab=signup">{tier.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="w-full bg-[hsl(var(--mint-green-bg))]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="mb-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">FAQ</h2>
            <p className="text-lg">Everything you need to know.</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>What is Adcopyai?</div>
              </AccordionTrigger>
              <AccordionContent>
                Adcopyai is a professional AI ad copy generator that creates high-converting advertising copy in seconds. It's built by performance marketers for performance marketers who want quick, easy and highly engaging headlines and descriptions fast without staring at a blank page. AI helps accelerate ideation and production so you can focus on strategy and optimization.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Who is Adcopyai for?</div>
              </AccordionTrigger>
              <AccordionContent>
                Adcopyai is designed for performance marketers, freelancers, and marketing agency staff who need to reduce copywriting workload while maintaining quality. It's ideal for lean teams that need professional ad copy quickly to support always-on campaigns and fast test-and-learn cycles.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>What can Adcopyai be used for?</div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">Use Adcopyai to generate:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Google Ads headlines and descriptions (and variations for testing)</li>
                  <li>Meta/Facebook & Instagram ad copy</li>
                  <li>TikTok Captions</li>
                  <li>X posts (Promoted Tweets)</li>
                  <li>More on the way</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>How does Adcopyai work?</div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Input your context:</strong> Historic ad copy, target audience, keywords/search queries, and any must-include messages.</li>
                  <li><strong>Choose a leading AI model:</strong> Select from the latest models to fit your speed/quality needs.</li>
                  <li><strong>Generate fast:</strong> Adcopyai uses refined prompts and patterns learned from multiple high-performing ads to produce optimized variations.</li>
                  <li><strong>Edit inline & download:</strong> Tweak directly in the UI, then download results for immediate use in your ad platform.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>How is Adcopyai different from other AI copywriting tools?</div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Performance focus:</strong> Built specifically for ads and short-form posts, not generic long-form content.</li>
                  <li><strong>Speed + simplicity:</strong> Clean UI, inline editing, and instant downloads reduce friction from idea to launch.</li>
                  <li><strong>Model choice:</strong> Access to leading AI models ensures you can prioritize either speed or depth on demand.</li>
                  <li><strong>Purpose-built prompts:</strong> Trained on patterns from high-performing ads to push for clarity, benefits, and action.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Will Adcopyai help my ads perform better?</div>
              </AccordionTrigger>
              <AccordionContent>
                Adcopyai is designed to support best-practice ad structures (e.g., clear value props, social proof, urgency) and classic copy frameworks like AIDA and PAS, which many marketers use to drive engagement and conversions. Use the tool to generate multiple angles, then A/B test in-platform for proven lifts. (No tool can guarantee performance; testing is essential.)
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>How fast is it?</div>
              </AccordionTrigger>
              <AccordionContent>
                Most users can create a full set of ad variations in seconds to minutes, dramatically faster than manual drafting. Agencies and marketers commonly cite AI copy tools for reducing production time and helping overcome writer's block during ideation.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Can I edit copy directly in the interface?</div>
              </AccordionTrigger>
              <AccordionContent>
                Yes. Adcopyai provides inline editing so you can polish tone, add brand terms, or localize for different audiences without switching tools. This keeps the workflow tight and saves time from brief to ready-to-ship copy.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-9">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Does Adcopyai respect ad platform character limits?</div>
              </AccordionTrigger>
              <AccordionContent>
                Yes, Adcopyai is built to help you stay within platform guidelines for all platforms (Google Ads, Meta, TikTok and X (Twitter)).
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-10">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Can I download the results?</div>
              </AccordionTrigger>
              <AccordionContent>
                Yes, export your approved variations for quick upload to your ad platforms or share with stakeholders for review.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-11">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Can I customize tone and style?</div>
              </AccordionTrigger>
              <AccordionContent>
                Yes, choose or describe your desired tone of voice (e.g., professional, friendly, bold, direct-response) and Adcopyai will tailor outputs. You can also include brand guidelines and must-use phrases to keep copy on-brand.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-12">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Which ad platforms and channels does it support?</div>
              </AccordionTrigger>
              <AccordionContent>
                AdCopyAI supports Google Ads, Meta (Facebook and Instagram), X and TikTok.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-13">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>What AI models can I choose from?</div>
              </AccordionTrigger>
              <AccordionContent>
                You can select from OpenAI GPT and Gemini models.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-14">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Why was Adcopyai created?</div>
              </AccordionTrigger>
              <AccordionContent>
                Because ad copywriting is time-consuming and writer's block is real, yet there are higher-value activities in campaign management (audience strategy, offers, landing page CRO, analytics). Adcopyai was built by performance marketers to save time, eliminate blank-page anxiety, and free you to focus on the right levers for performance.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-15">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Is Adcopyai suitable for freelancers and small teams?</div>
              </AccordionTrigger>
              <AccordionContent>
                Yes. The product is intentionally lightweight and fast, making it perfect for solo marketers and small teams who need production-ready copy without adding process overhead.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-16">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>What's the pricing?</div>
              </AccordionTrigger>
              <AccordionContent>
                Simple, transparent pricing: £4.99 per month or £49.99 per year. Running modern AI models incurs token costs, so we keep pricing straightforward and accessible for pros.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-17">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Does it help with testing and iteration?</div>
              </AccordionTrigger>
              <AccordionContent>
                Yes. Generate multiple angles (benefit-led, offer-led, urgency-led, social-proof-led), then run A/B tests in your ad platform.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-18">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>Will Adcopyai replace copywriters?</div>
              </AccordionTrigger>
              <AccordionContent>
                No. Think of Adcopyai as your creative accelerator, great for brainstorming, first drafts, and high-volume variations. Human judgment still wins for brand nuance, compliance, and offer strategy. This hybrid approach is how many teams use AI today to speed up without sacrificing quality.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-19">
              <AccordionTrigger className="text-left text-lg">
                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-orange-500"/>How do I get started?</div>
              </AccordionTrigger>
              <AccordionContent>
                Sign up, paste your campaign/product context (audience, offer, keywords/search queries), select your tone, choose your AI model, and click Generate. Edit inline, download, and start testing.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="w-full bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to transform your ad performance?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join performance marketers who ship winning ads 10x faster with AdcopyAI.
          </p>
          <Button size="lg" className="h-12 px-8 bg-[hsl(var(--hero-blue))] hover:bg-[hsl(var(--hero-blue))]/90 text-white" asChild>
            <Link to="/auth?tab=signup">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} AdcopyAI. All rights reserved.</div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#features" className="text-muted-foreground hover:underline">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:underline">Pricing</a>
            <a href="#faq" className="text-muted-foreground hover:underline">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
