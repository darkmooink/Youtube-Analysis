export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  export async function resolveAll<T extends { [key: string]: any }>(
    values: T
  ): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
    const entries = Object.entries(values) as [keyof T, T[keyof T]][];
    const results = await Promise.all(entries.map(([, val]) => Promise.resolve(val)));
    const resolved = Object.fromEntries(
      entries.map(([key], i) => [key, results[i]])
    ) as { [K in keyof T]: Awaited<T[K]> };
    return resolved;
  }