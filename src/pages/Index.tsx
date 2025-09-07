import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Wand2, Target, Clock, BarChart3, Shield, Users, ChevronDown, Twitter, Facebook, Linkedin } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-border px-10 py-3">
          <div className="flex items-center gap-4 text-foreground">
            <div className="size-4">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em]">AdCopy AI</h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-foreground text-sm font-medium leading-normal" href="#">Product</a>
              <a className="text-foreground text-sm font-medium leading-normal" href="#">Solutions</a>
              <a className="text-foreground text-sm font-medium leading-normal" href="#">Pricing</a>
              <a className="text-foreground text-sm font-medium leading-normal" href="#">Resources</a>
            </div>
            <div className="flex gap-2">
              {user ? (
                <Button asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="secondary" asChild>
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

        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Hero Section */}
            <div className="@container">
              <div className="md:p-4">
                <div
                  className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat md:gap-8 md:rounded-xl items-start justify-end px-4 pb-10 md:px-10"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAiCTCFETnjlqsYzkRLC90stAtVPrNolGzRwZC8-LhPHezJMjI29dErWcl-El8p8QPDsJBqZPIpFCVNI6UrUuUcV1b5MUlJ9tYnEWu-uYQFHMGmu2NC1oeCBv86Cg5HKqr_3gZvlS7UPg4ZPeUimiWhsF5e9bQASUiXRG4Qz51cG5yxQs5OeCH5k_m93EFcnqwKgXYe67rJ3QUhR1LRhiqV-rydeY0D_cWfJnYoUTgi7Ekytq6r2DkeHXyA5ismZ2TRe71wK327CHyc")'
                  }}
                >
                  <div className="flex flex-col gap-2 text-left">
                    <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl md:font-black md:leading-tight md:tracking-[-0.033em]">
                      Unlock Peak Ad Performance
                    </h1>
                    <h2 className="text-white text-sm font-normal leading-normal md:text-base md:font-normal md:leading-normal">
                      Generate high-converting Google Ads copy in seconds with our AI-powered tool. Drive more leads and sales with less effort.
                    </h2>
                  </div>
                  <div className="flex-wrap gap-3 flex">
                    <Button size="lg" className="bg-[#1380ec] text-slate-50 hover:bg-[#1380ec]/90" asChild>
                      <Link to="/auth?tab=signup">Start Free Trial</Link>
                    </Button>
                    <Button variant="secondary" size="lg">
                      Request Demo
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Trusted by Leading Brands */}
            <h3 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Trusted by Leading Brands</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl bg-muted"></div>
                </div>
              ))}
            </div>

            {/* Marketer Outcomes */}
            <h3 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Marketer Outcomes</h3>
            <div className="flex overflow-x-auto scroll-smooth pb-4">
              <div className="flex items-stretch p-4 gap-3">
                {[
                  { title: "Increase Click-Through Rate by 30%", desc: "Our AI optimizes your ad copy for maximum engagement." },
                  { title: "Boost Conversion Rates by 25%", desc: "Drive more qualified leads with compelling ad messages." },
                  { title: "Reduce Cost Per Acquisition by 20%", desc: "Get more value from your ad spend with efficient campaigns." }
                ].map((outcome, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                    <div className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col bg-muted"></div>
                    <div>
                      <p className="text-foreground text-base font-medium leading-normal">{outcome.title}</p>
                      <p className="text-muted-foreground text-sm font-normal leading-normal">{outcome.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <h3 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">How It Works</h3>
            <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
              {[
                { title: "Connect Your Account", desc: "Securely link your Google Ads account." },
                { title: "Define Your Target Audience", desc: "Specify your ideal customer profile and keywords." },
                { title: "Generate and Launch", desc: "Review AI-generated copy, customize, and launch your campaign." }
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-1 pt-3">
                    <div className="text-foreground flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {i + 1}
                    </div>
                    {i < 2 && <div className="w-[1.5px] bg-border h-2 grow"></div>}
                  </div>
                  <div className="flex flex-1 flex-col py-3">
                    <p className="text-foreground text-base font-medium leading-normal">{step.title}</p>
                    <p className="text-muted-foreground text-base font-normal leading-normal">{step.desc}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Key Features */}
            <h3 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Key Features</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              {[
                { icon: Wand2, title: "AI-Powered Copy Generation", desc: "Generate compelling ad copy variations in seconds." },
                { icon: Target, title: "Precise Audience Targeting", desc: "Reach your ideal customers with laser-focused targeting." },
                { icon: Clock, title: "Automated Campaign Management", desc: "Automate repetitive tasks and optimize your campaigns." },
                { icon: BarChart3, title: "Performance Tracking & Reporting", desc: "Monitor key metrics and track your campaign performance." },
                { icon: Shield, title: "Security & Compliance", desc: "Industry-leading security and data privacy." },
                { icon: Users, title: "Team Collaboration Tools", desc: "Collaborate with your team on ad campaigns." }
              ].map((feature, i) => (
                <div key={i} className="flex flex-1 gap-3 rounded-lg border border-border bg-card p-4 flex-col">
                  <feature.icon className="text-foreground w-6 h-6" />
                  <div className="flex flex-col gap-1">
                    <h2 className="text-foreground text-base font-bold leading-tight">{feature.title}</h2>
                    <p className="text-muted-foreground text-sm font-normal leading-normal">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample Ad Assets */}
            <h3 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Sample Ad Assets</h3>
            <div className="flex overflow-x-auto scroll-smooth pb-4">
              <div className="flex items-stretch p-4 gap-3">
                {[
                  { headline: "Drive Sales with Our Product", desc: "Increase your sales and conversions with our AI-powered ad copy generator." },
                  { headline: "Reach Your Target Audience", desc: "Connect with your ideal customers and boost your ad performance." },
                  { headline: "Maximize Your Ad ROI", desc: "Optimize your ad spend and achieve your marketing goals." }
                ].map((asset, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60">
                    <div className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col bg-muted"></div>
                    <div>
                      <p className="text-foreground text-base font-medium leading-normal">Headline: {asset.headline}</p>
                      <p className="text-muted-foreground text-sm font-normal leading-normal">Description: {asset.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrations */}
            <h3 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Integrations</h3>
            <div className="flex w-full grow bg-card p-4">
              <div className="w-full gap-1 overflow-hidden bg-muted aspect-[3/2] rounded-xl flex items-center justify-center">
                <p className="text-muted-foreground">Integration logos placeholder</p>
              </div>
            </div>

            {/* Pricing */}
            <h3 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Pricing</h3>
            <div className="flex px-4 py-3">
              <div className="flex h-10 flex-1 items-center justify-center rounded-xl bg-muted p-1">
                <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-xl px-2 bg-background shadow-sm text-foreground text-sm font-medium leading-normal">
                  <span className="truncate">Monthly</span>
                  <input type="radio" name="pricing" className="sr-only" value="Monthly" defaultChecked />
                </label>
                <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-xl px-2 text-muted-foreground text-sm font-medium leading-normal">
                  <span className="truncate">Annual</span>
                  <input type="radio" name="pricing" className="sr-only" value="Annual" />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(228px,1fr))] gap-2.5 px-4 py-3">
              {[
                { name: "Basic", price: "$49", features: ["1,000 Ad Copies", "Basic Reporting", "Email Support"] },
                { name: "Pro", price: "$99", features: ["5,000 Ad Copies", "Advanced Reporting", "Priority Support"], popular: true },
                { name: "Enterprise", price: "Custom", features: ["Unlimited Ad Copies", "Custom Reporting", "Dedicated Account Manager"] }
              ].map((plan, i) => (
                <div key={i} className="flex flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h1 className="text-foreground text-base font-bold leading-tight">{plan.name}</h1>
                      {plan.popular && (
                        <Badge className="bg-[#1380ec] text-slate-50">Popular</Badge>
                      )}
                    </div>
                    <p className="flex items-baseline gap-1 text-foreground">
                      <span className="text-foreground text-4xl font-black leading-tight tracking-[-0.033em]">{plan.price}</span>
                      <span className="text-foreground text-base font-bold leading-tight">/month</span>
                    </p>
                  </div>
                  <Button variant="secondary">
                    {plan.name === "Enterprise" ? "Contact Us" : "Get Started"}
                  </Button>
                  <div className="flex flex-col gap-2">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="text-[13px] font-normal leading-normal flex gap-3 text-foreground">
                        <Check className="w-5 h-5 text-green-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Security & Compliance */}
            <h3 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Security & Compliance</h3>
            <p className="text-foreground text-base font-normal leading-normal pb-3 pt-1 px-4">
              We prioritize your data security and comply with industry standards. Your information is protected with encryption and strict access controls.
            </p>

            {/* FAQ */}
            <h3 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Frequently Asked Questions</h3>
            <div className="flex flex-col p-4 gap-3">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How does the AI work?</AccordionTrigger>
                  <AccordionContent>
                    Our AI uses advanced natural language processing and machine learning algorithms to generate high-performing ad copy based on your inputs and target audience.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What integrations are available?</AccordionTrigger>
                  <AccordionContent>
                    We integrate with Google Ads, Facebook Ads, and other major advertising platforms to streamline your workflow.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>What is the refund policy?</AccordionTrigger>
                  <AccordionContent>
                    We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact support for a full refund.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Final CTA */}
            <div className="flex flex-col justify-end gap-6 px-4 py-10 md:gap-8 md:px-10 md:py-20">
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-foreground tracking-light text-[32px] font-bold leading-tight md:text-4xl md:font-black md:leading-tight md:tracking-[-0.033em] max-w-[720px] mx-auto">
                  Ready to Boost Your Ad Performance?
                </h1>
                <p className="text-foreground text-base font-normal leading-normal max-w-[720px] mx-auto">
                  Start your free trial today and experience the power of AI-driven ad copy generation.
                </p>
              </div>
              <div className="flex flex-1 justify-center">
                <Button size="lg" className="bg-[#1380ec] text-slate-50 hover:bg-[#1380ec]/90" asChild>
                  <Link to="/auth?tab=signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex justify-center">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <footer className="flex flex-col gap-6 px-5 py-10 text-center">
              <div className="flex flex-wrap items-center justify-center gap-6 md:flex-row md:justify-around">
                <a className="text-muted-foreground text-base font-normal leading-normal min-w-40" href="#">Product</a>
                <a className="text-muted-foreground text-base font-normal leading-normal min-w-40" href="#">Solutions</a>
                <a className="text-muted-foreground text-base font-normal leading-normal min-w-40" href="#">Pricing</a>
                <a className="text-muted-foreground text-base font-normal leading-normal min-w-40" href="#">Resources</a>
                <a className="text-muted-foreground text-base font-normal leading-normal min-w-40" href="#">About Us</a>
                <a className="text-muted-foreground text-base font-normal leading-normal min-w-40" href="#">Contact Us</a>
                <a className="text-muted-foreground text-base font-normal leading-normal min-w-40" href="#">Terms of Service</a>
                <a className="text-muted-foreground text-base font-normal leading-normal min-w-40" href="#">Privacy Policy</a>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#">
                  <Twitter className="text-muted-foreground w-6 h-6" />
                </a>
                <a href="#">
                  <Facebook className="text-muted-foreground w-6 h-6" />
                </a>
                <a href="#">
                  <Linkedin className="text-muted-foreground w-6 h-6" />
                </a>
              </div>
              <p className="text-muted-foreground text-base font-normal leading-normal">© 2024 AdCopy AI. All rights reserved.</p>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
