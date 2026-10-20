/** Converts Mongoose lean docs (ObjectId, Date) into plain JSON-safe objects for Client Components. */
export function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}
