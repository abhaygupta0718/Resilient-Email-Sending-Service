class MockProvider {
  constructor(name) {
    this.name = name;
    this.failRate = 0.3;
    this.failureCount = 0;
    this.circuitOpen = false;
    this.lastFailureTime = null;
  }

  async send(email) {
    if (this.circuitOpen && Date.now() - this.lastFailureTime < 10000) {
      throw new Error(`${this.name} circuit is open`);
    }

    if (Math.random() < this.failRate) {
      this.failureCount++;
      if (this.failureCount >= 3) {
        this.circuitOpen = true;
        this.lastFailureTime = Date.now();
      }
      throw new Error(`${this.name} failed to send`);
    }

    this.failureCount = 0;
    return `${this.name} sent email to ${email.to}`;
  }
}

class EmailService {
  constructor() {
    this.providers = [new MockProvider('ProviderA'), new MockProvider('ProviderB')];
    this.sentEmails = new Set();
    this.rateLimit = { count: 0, windowStart: Date.now() };
    this.logs = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(`[${timestamp}] ${message}`);
  }

  rateLimitCheck() {
    const now = Date.now();
    if (now - this.rateLimit.windowStart > 10000) {
      this.rateLimit = { count: 0, windowStart: now };
    }
    if (this.rateLimit.count >= 5) {
      throw new Error('Rate limit exceeded');
    }
    this.rateLimit.count++;
  }

  async sendEmail(email) {
    if (this.sentEmails.has(email.id)) {
      this.log(`Duplicate email ID: ${email.id}, skipping.`);
      return 'Duplicate email skipped';
    }

    this.rateLimitCheck();

    for (let provider of this.providers) {
      let attempt = 0;
      let backoff = 500;
      while (attempt < 3) {
        try {
          const result = await provider.send(email);
          this.sentEmails.add(email.id);
          this.log(result);
          return result;
        } catch (err) {
          this.log(`Attempt ${attempt + 1} failed with ${provider.name}: ${err.message}`);
          attempt++;
          await new Promise(res => setTimeout(res, backoff));
          backoff *= 2;
        }
      }
      this.log(`${provider.name} exhausted, switching provider...`);
    }

    this.log('All providers failed');
    return 'Failed to send email';
  }

  getLogs() {
    return this.logs.join('\n');
  }
}

window.emailService = new EmailService();
