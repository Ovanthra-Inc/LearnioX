// LearnioX — Core HTTP/API Client Utility

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  useMock?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
let useRealApi = false; // Global switch to toggle between mock data and real API calls

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, useMock = !useRealApi, ...customOptions } = options;

  // 1. Generate tracing metadata headers (correlation ids)
  const requestId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  const correlationId = customOptions.headers 
    ? (customOptions.headers as Record<string, string>)["x-correlation-id"] || requestId
    : requestId;

  // 2. Mock mode handling
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error(`Mock mode active. API Client endpoint call is mocked: ${endpoint}`);
  }

  // 3. Build query parameters
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      searchParams.append(key, String(val));
    });
    url += `?${searchParams.toString()}`;
  }

  // 4. Configure headers
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": requestId,
    "x-correlation-id": correlationId,
  };

  const config: RequestInit = {
    ...customOptions,
    headers: {
      ...defaultHeaders,
      ...customOptions.headers,
    },
  };

  // 5. Network fetch execution
  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      // Ignore parsing error if response isn't JSON
    }
    throw new Error(
      errorJson?.message || 
      errorJson?.detail || 
      `HTTP Error ${response.status}: ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, "method">) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method">) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
  
  // Dynamic controls
  isMockActive: () => !useRealApi,
  setUseRealApi: (val: boolean) => { useRealApi = val; },
};
