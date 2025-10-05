// Alert management system for critical issues
import { logger } from './logger.ts';

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
}

interface Alert {
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface AlertState {
  lastAlertTime: number;
  alertCount: number;
}

class AlertManager {
  private alertStates: Map<string, AlertState>;
  private readonly COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes between alerts
  private readonly ERROR_RATE_THRESHOLD = 10; // 10% error rate
  private readonly RATE_LIMIT_BREACH_THRESHOLD = 100; // 100 breaches in 5 min
  private readonly CIRCUIT_OPEN_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.alertStates = new Map();
  }

  async checkAndAlert(metrics: any): Promise<void> {
    const alerts: Alert[] = [];

    // Check error rate
    if (metrics.errorRate >= this.ERROR_RATE_THRESHOLD && metrics.requests >= 10) {
      if (this.shouldSendAlert('high_error_rate')) {
        alerts.push({
          severity: AlertSeverity.CRITICAL,
          title: 'High Error Rate Detected',
          message: `Error rate is ${metrics.errorRate.toFixed(1)}% (${metrics.errors}/${metrics.requests} requests failed)`,
          timestamp: new Date().toISOString(),
          metadata: {
            errorRate: metrics.errorRate,
            totalErrors: metrics.errors,
            totalRequests: metrics.requests,
          },
        });
      }
    }

    // Check circuit breakers
    for (const [provider, state] of Object.entries(metrics.providers as Record<string, any>)) {
      if (state.circuitState === 'OPEN') {
        const alertKey = `circuit_open_${provider}`;
        if (this.shouldSendAlert(alertKey)) {
          alerts.push({
            severity: AlertSeverity.CRITICAL,
            title: `Circuit Breaker Open: ${provider}`,
            message: `The ${provider} API circuit breaker is OPEN after ${state.failures} consecutive failures`,
            timestamp: new Date().toISOString(),
            metadata: {
              provider,
              failures: state.failures,
              state: state.circuitState,
            },
          });
        }
      }
    }

    // Check rate limit breaches
    if (metrics.rateLimitBreaches >= this.RATE_LIMIT_BREACH_THRESHOLD) {
      if (this.shouldSendAlert('excessive_rate_limits')) {
        alerts.push({
          severity: AlertSeverity.WARNING,
          title: 'Excessive Rate Limit Breaches',
          message: `${metrics.rateLimitBreaches} rate limit breaches detected in the last 5 minutes`,
          timestamp: new Date().toISOString(),
          metadata: {
            breaches: metrics.rateLimitBreaches,
          },
        });
      }
    }

    // Send all alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  private shouldSendAlert(alertKey: string): boolean {
    const now = Date.now();
    const state = this.alertStates.get(alertKey);

    if (!state || now - state.lastAlertTime > this.COOLDOWN_MS) {
      this.alertStates.set(alertKey, {
        lastAlertTime: now,
        alertCount: (state?.alertCount || 0) + 1,
      });
      return true;
    }

    return false;
  }

  private async sendAlert(alert: Alert): Promise<void> {
    // Log the alert
    logger.error(`ALERT [${alert.severity}] ${alert.title}`, undefined, {
      message: alert.message,
      ...alert.metadata,
    });

    // Send to webhook if configured
    const webhookUrl = Deno.env.get('ALERT_WEBHOOK_URL');
    if (!webhookUrl) {
      logger.warn('No ALERT_WEBHOOK_URL configured, alert logged only');
      return;
    }

    try {
      const payload = {
        username: 'Ad Copy Generator Alerts',
        embeds: [{
          title: `🚨 ${alert.title}`,
          description: alert.message,
          color: alert.severity === AlertSeverity.CRITICAL ? 15158332 : 16776960, // Red or yellow
          fields: alert.metadata ? Object.entries(alert.metadata).map(([key, value]) => ({
            name: key,
            value: String(value),
            inline: true,
          })) : [],
          timestamp: alert.timestamp,
        }],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.error('Failed to send alert to webhook', undefined, {
          status: response.status,
          statusText: response.statusText,
        });
      } else {
        logger.info('Alert sent successfully', { alertTitle: alert.title });
      }
    } catch (error) {
      logger.error('Error sending alert to webhook', error as Error);
    }
  }

  getAlertStats() {
    const stats: Record<string, any> = {};
    for (const [key, state] of this.alertStates.entries()) {
      stats[key] = {
        lastAlertTime: new Date(state.lastAlertTime).toISOString(),
        totalAlerts: state.alertCount,
      };
    }
    return stats;
  }
}

// Singleton instance
export const alertManager = new AlertManager();
