import { TokenBucket } from './token_bucket';

export interface RateLimiter {
  isAllowed(clientIP: string): Promise<boolean>;//we might want to make this async in case we switch to a distributed store later (e.g., Redis)
}

interface RateLimiterOptions {
  capacity: number;
  refillRate: number;
  bucketTTL?: number;   // ms before idle bucket is cleaned up, default 60s
}

export class InMemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, { bucket: TokenBucket; lastSeen: number }>();
  private bucketTTL: number;
  private capacity: number;
  private refillRate: number;

  constructor(options: RateLimiterOptions) {
    this.capacity = options.capacity;
    this.refillRate = options.refillRate;
    this.bucketTTL = options.bucketTTL ?? 60_000;

    // cleanup idle buckets periodically — prevent memory leak
    setInterval(() => this.cleanup(), this.bucketTTL);
  }

  async isAllowed(clientIP: string): Promise<boolean> {
    let entry = this.buckets.get(clientIP);

    if (!entry) {
      // first time seeing this IP — create a bucket
      entry = {
        bucket: new TokenBucket({ capacity: this.capacity, refillRate: this.refillRate }),
        lastSeen: Date.now()
      };
      this.buckets.set(clientIP, entry);
    }

    entry.lastSeen = Date.now();  // update activity timestamp
    return entry.bucket.consume();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.buckets.entries()) {
      if (now - entry.lastSeen > this.bucketTTL) {
        this.buckets.delete(ip);  // evict idle bucket
      }
    }
  }
}