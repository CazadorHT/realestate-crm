type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export const rateLimit = (options?: Options) => {
  const tokenCache = new Map();
  const { uniqueTokenPerInterval = 500, interval = 60000 } = options || {};

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        resolve();

        if (isRateLimited) {
          reject();
        }

        setTimeout(() => {
          tokenCount[0] -= 1;
          if (tokenCount[0] <= 0) {
            tokenCache.delete(token);
          }
        }, interval);
      }),
  };
};
