interface TokenBucketOptions {
  capacity: number;        // max tokens
  refillRate: number;      // tokens per second
}

export class TokenBucket {
  private tokens: number;
  private lastRefillTime: number;  // timestamp in ms
  private capacity: number;
  private refillRate: number;

  constructor(options: TokenBucketOptions) {
    this.capacity = options.capacity;
    this.refillRate = options.refillRate;
    this.tokens = options.capacity;   // start full
    this.lastRefillTime = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefillTime) / 1000; // convert to seconds
    
    const tokensToAdd = elapsed * this.refillRate;
    
    // cap at capacity — bucket can't overflow
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  public consume(): boolean {
    this.refill();  // always refill first before checking

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;   // allowed
    }

    return false;    // rejected
  }
}
