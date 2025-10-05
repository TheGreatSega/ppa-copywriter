import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { metricsCollector } from "../generate-ad-copy/metrics.ts";
import { circuitBreaker } from "../generate-ad-copy/circuit-breaker.ts";
import { requestQueue } from "../generate-ad-copy/queue.ts";
import { alertManager } from "../generate-ad-copy/alerting.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get all metrics
    const metrics = metricsCollector.getMetrics();
    const circuitStatus = circuitBreaker.getAllStatus();
    const queueStats = requestQueue.getQueueStats();
    const alertStats = alertManager.getAlertStats();

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        ...metrics,
        queue: queueStats,
      },
      circuitBreakers: circuitStatus,
      alerts: alertStats,
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
