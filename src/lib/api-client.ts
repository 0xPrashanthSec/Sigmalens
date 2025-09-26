import { ApiResponse } from "../../shared/types"
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    // Try to parse error from JSON, but fallback to text
    if (contentType && contentType.includes('application/json')) {
      const json = (await res.json()) as ApiResponse;
      throw new Error(json.error || `Request failed with status ${res.status}`);
    }
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  if (contentType && contentType.includes('application/json')) {
    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success || json.data === undefined) {
      throw new Error(json.error || 'API request failed');
    }
    return json.data;
  }
  // For non-JSON responses, we assume the caller expects the raw text.
  // This is a bit of a type-cast hack, but it's needed for the raw rule content.
  const text = await res.text();
  return text as unknown as T;
}