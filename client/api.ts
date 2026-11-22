import { useEffect, useState } from 'react';
import type { ApiErrorResponse, EnquiryInput } from '../shared/contracts';

export class RequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: ApiErrorResponse['error']['fields'],
  ) {
    super(message);
  }
}

async function request(path: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(path, options);
  if (response.ok) return response;

  const body = await response.json().catch(() => null) as ApiErrorResponse | null;
  throw new RequestError(
    response.status,
    body?.error?.message || 'The request could not be completed. Please try again.',
    body?.error?.fields,
  );
}

type ResourceResult<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: unknown };

export function useResource<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    path: string;
    attempt: number;
    result: ResourceResult<T>;
  }>();

  useEffect(() => {
    if (!path) return;

    const controller = new AbortController();
    request(path, { signal: controller.signal })
      .then((response) => response.json() as Promise<T>)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ path, attempt, result: { status: 'ready', data } });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ path, attempt, result: { status: 'error', error } });
        }
      });
    return () => controller.abort();
  }, [path, attempt]);

  // A route change can render before its request effect runs.
  const result: ResourceResult<T> = state && state.path === path && state.attempt === attempt
    ? state.result
    : { status: 'loading' };

  return { ...result, retry: () => setAttempt((previous) => previous + 1) };
}

export async function sendEnquiry(id: string, details: EnquiryInput): Promise<void> {
  await request(`/api/products/${encodeURIComponent(id)}/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  });
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof RequestError ? error.message : fallback;
}
