// Metrics collection for performance monitoring and alerting
interface MetricSnapshot {
  timestamp: number;
  requests: number;
  errors: number;
  responseTimes: number[];
  rateLimitBreaches: number;
}

interface ProviderMetrics {
  circuitState: string;
  failures: number;
}

class MetricsCollector {
  private snapshots: MetricSnapshot[];
  private currentSnapshot: MetricSnapshot;
  private providerMetrics: Map<string, ProviderMetrics>;
  private readonly WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SNAPSHOTS = 12; // Keep 1 hour of data

  constructor() {
    this.snapshots = [];
    this.currentSnapshot = this.createSnapshot();
    this.providerMetrics = new Map();

    // Rotate snapshot every 5 minutes
    setInterval(() => this.rotateSnapshot(), this.WINDOW_MS);
  }

  private createSnapshot(): MetricSnapshot {
    return {
      timestamp: Date.now(),
      requests: 0,
      errors: 0,
      responseTimes: [],
      rateLimitBreaches: 0,
    };
  }

  private rotateSnapshot(): void {
    this.snapshots.push(this.currentSnapshot);
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
    this.currentSnapshot = this.createSnapshot();
  }

  recordRequest(durationMs: number): void {
    this.currentSnapshot.requests++;
    this.currentSnapshot.responseTimes.push(durationMs);
  }

  recordError(): void {
    this.currentSnapshot.errors++;
  }

  recordRateLimitBreach(): void {
    this.currentSnapshot.rateLimitBreaches++;
  }

  updateProviderMetrics(provider: string, state: string, failures: number): void {
    this.providerMetrics.set(provider, { circuitState: state, failures });
  }

  getMetrics() {
    const allSnapshots = [...this.snapshots, this.currentSnapshot];
    
    // Calculate aggregates
    const totalRequests = allSnapshots.reduce((sum, s) => sum + s.requests, 0);
    const totalErrors = allSnapshots.reduce((sum, s) => sum + s.errors, 0);
    const allResponseTimes = allSnapshots.flatMap(s => s.responseTimes);
    const totalRateLimitBreaches = allSnapshots.reduce((sum, s) => sum + s.rateLimitBreaches, 0);

    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const avgResponseTime = allResponseTimes.length > 0
      ? allResponseTimes.reduce((sum, t) => sum + t, 0) / allResponseTimes.length
      : 0;

    const p95ResponseTime = this.calculatePercentile(allResponseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(allResponseTimes, 99);

    return {
      window: {
        durationMs: this.WINDOW_MS * this.MAX_SNAPSHOTS,
        snapshotCount: allSnapshots.length,
      },
      requests: {
        total: totalRequests,
        perMinute: totalRequests / ((this.WINDOW_MS * allSnapshots.length) / 60000),
      },
      errors: {
        total: totalErrors,
        rate: errorRate,
      },
      responseTime: {
        avg: Math.round(avgResponseTime),
        p95: Math.round(p95ResponseTime),
        p99: Math.round(p99ResponseTime),
      },
      rateLimits: {
        breaches: totalRateLimitBreaches,
      },
      providers: Object.fromEntries(this.providerMetrics),
      currentSnapshot: {
        requests: this.currentSnapshot.requests,
        errors: this.currentSnapshot.errors,
        rateLimitBreaches: this.currentSnapshot.rateLimitBreaches,
      },
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  // Get metrics for alerting (last 5 minutes only)
  getCurrentWindowMetrics() {
    const requests = this.currentSnapshot.requests;
    const errors = this.currentSnapshot.errors;
    const errorRate = requests > 0 ? (errors / requests) * 100 : 0;
    const rateLimitBreaches = this.currentSnapshot.rateLimitBreaches;

    return {
      requests,
      errors,
      errorRate,
      rateLimitBreaches,
      providers: Object.fromEntries(this.providerMetrics),
    };
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();
