const PAGE_SIZE = 1000;

/** PostgREST caps an unbounded select at its configured max-rows (1000 by default).
 * This app's graph payload is expected to reach thousands of edges, so any query that
 * could plausibly exceed that cap pages through `.range()` until a short page signals
 * the end, instead of silently truncating. */
export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}
