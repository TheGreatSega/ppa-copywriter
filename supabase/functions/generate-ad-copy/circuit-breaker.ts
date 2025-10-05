// Circuit breaker pattern for external API resilience
enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failing, reject immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if recovered
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

class CircuitBreaker {
  private circuits: Map<string, CircuitBreakerState>;
  private readonly FAILURE_THRESHOLD = 5;
  private readonly TIMEOUT_MS = 60 * 1000; // 60 seconds
  private readonly HALF_OPEN_MAX_ATTEMPTS = 3;

  constructor() {
    this.circuits = new Map();
  }

  async execute<T>(
    provider: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const circuit = this.getCircuit(provider);
    const now = Date.now();

    // If circuit is OPEN, check if timeout has passed
    if (circuit.state === CircuitState.OPEN) {
      if (now - circuit.lastFailureTime > this.TIMEOUT_MS) {
        console.log(`Circuit breaker for ${provider}: Moving to HALF_OPEN state`);
        circuit.state = CircuitState.HALF_OPEN;
        circuit.failures = 0;
      } else {
        const waitTime = Math.ceil((this.TIMEOUT_MS - (now - circuit.lastFailureTime)) / 1000);
        throw new Error(
          `${provider} API is currently unavailable. Circuit breaker is OPEN. Retry in ${waitTime}s.`
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess(provider);
      return result;
    } catch (error) {
      this.onFailure(provider);
      throw error;
    }
  }

  private getCircuit(provider: string): CircuitBreakerState {
    if (!this.circuits.has(provider)) {
      this.circuits.set(provider, {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailureTime: 0,
        lastSuccessTime: Date.now(),
      });
    }
    return this.circuits.get(provider)!;
  }

  private onSuccess(provider: string): void {
    const circuit = this.getCircuit(provider);
    circuit.failures = 0;
    circuit.lastSuccessTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      console.log(`Circuit breaker for ${provider}: Moving to CLOSED state (recovered)`);
      circuit.state = CircuitState.CLOSED;
    }
  }

  private onFailure(provider: string): void {
    const circuit = this.getCircuit(provider);
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    console.error(
      `Circuit breaker for ${provider}: Failure #${circuit.failures} (threshold: ${this.FAILURE_THRESHOLD})`
    );

    if (circuit.failures >= this.FAILURE_THRESHOLD) {
      console.error(`Circuit breaker for ${provider}: Moving to OPEN state (too many failures)`);
      circuit.state = CircuitState.OPEN;
    }
  }

  getStatus(provider: string): { state: CircuitState; failures: number } {
    const circuit = this.getCircuit(provider);
    return {
      state: circuit.state,
      failures: circuit.failures,
    };
  }

  getAllStatus(): Record<string, { state: CircuitState; failures: number }> {
    const status: Record<string, any> = {};
    for (const [provider, circuit] of this.circuits.entries()) {
      status[provider] = {
        state: circuit.state,
        failures: circuit.failures,
      };
    }
    return status;
  }
}

// Singleton instance
export const circuitBreaker = new CircuitBreaker();
