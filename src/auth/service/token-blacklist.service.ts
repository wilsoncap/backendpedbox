import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private readonly revoked = new Set<string>();

  revoke(jti: string, ttlMs: number): void {
    this.revoked.add(jti);

    setTimeout(
      () => {
        this.revoked.delete(jti);
      },
      Math.max(ttlMs, 0),
    );
  }

  isRevoked(jti: string): boolean {
    return this.revoked.has(jti);
  }
}
