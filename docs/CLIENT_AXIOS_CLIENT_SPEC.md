# LearnioX Frontend Client Architecture & Integration Specification

> **Document Type**: Frontend Architecture & API Integration Blueprint  
> **Target Gateway**: `http://localhost/api/v1` (Nginx Ingress → Python BFF Gateway → Microservices) or `https://<ngrok-domain>/api/v1`  
> **Status**: Approved Specification for Client Implementation Phase

---

## 1. Technology Stack Requirements

When building the client application (`client-service`), adhere strictly to the following technology stack:

1. **UI & Components**: **Shadcn UI** (Radix Primitives + Vanilla Tailwind CSS utility classes).
2. **Theming**: **Dark & Light Mode** support out-of-the-box (`next-themes` or custom `ThemeProvider` context with persistence).
3. **State Management**: **Redux Toolkit (RTK)** for global application state (user auth session, global UI state, active institution context).
4. **Data Fetching & Caching**: **TanStack React Query (v5)** combined with a centralized **Axios** HTTP client (`apiClient`).

---

## 2. Infrastructure Flow & Topology

```
+-----------------------------------------------------------------------------------+
|                            Client App (React / Vite)                              |
|   +-------------------+    +--------------------+    +------------------------+   |
|   | Shadcn UI Components | |  Redux Toolkit Store| | TanStack React Query v5 |   |
|   +-------------------+    +--------------------+    +------------------------+   |
|                                     |                            |                |
|                                     +------------+---------------+                |
|                                                  |                                |
|                                                  v                                |
|                                       [Central Axios apiClient]                   |
+--------------------------------------------------+--------------------------------+
                                                   | HTTP / HTTPS Requests
                                                   v
                                 +-----------------------------------+
                                 |    Nginx Reverse Proxy (:80)      |
                                 +-----------------------------------+
                                                   |
                                                   v
                                 +-----------------------------------+
                                 |  Python BFF API Gateway (:8080)   |
                                 +-----------------------------------+
                                                   |
                             +---------------------+---------------------+
                             |                                           |
                             v                                           v
                   +-------------------+                       +-------------------+
                   |  server-service   |                       |    ai-service     |
                   |   (FastAPI :8000) |                       |   (FastAPI :8001) |
                   +-------------------+                       +-------------------+
```

---

## 3. Standardized API Response Contract

All microservice responses proxied through the BFF API Gateway return this uniform JSON structure:

### Success Contract
```json
{
  "success": true,
  "message": "Human readable status description",
  "data": { ... },
  "error": null
}
```

### Error Contract
```json
{
  "success": false,
  "message": "Human readable error description",
  "data": null,
  "error": {
    "code": "ERROR_CODE_STRING",
    "details": [...]
  }
}
```

---

## 4. Centralized Axios Client (`src/api/client.ts`)

```typescript
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error: {
    code: string;
    details: string[];
  } | null;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Interceptor 1: Attach Authorization Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor 2: Automatic Token Refresh & Response Extraction
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response.data, // Unwraps outer Axios payload, returning ApiResponse<T>
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post<ApiResponse<{ access_token: string }>>(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const newAccessToken = refreshResponse.data.data.access_token;
        localStorage.setItem('access_token', newAccessToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);
```

---

## 5. React Query Integration Example (`src/hooks/useCourses.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '../api/client';

export interface Course {
  id: string;
  title: string;
  slug: string;
  price: number;
}

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<Course[]>>('/courses');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
```

---

## 6. Redux Toolkit Store Integration (`src/store/authSlice.ts`)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark' | 'system';
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  theme: 'dark',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.clear();
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
  },
});

export const { setUser, logout, setTheme } = authSlice.actions;
export default authSlice.reducer;
```

---

## 7. Active Microservice Gateway Routing Map

| Route Prefix | Service Name | Backend Target | Description |
|---|---|---|---|
| `/api/v1/*` | `server-service` | `http://server-service:8000` | Core authentication, course management, enrollments, payments, storage |
| `/api/v1/ai/*` | `ai-service` | `http://ai-service:8001` | AI tutoring, automated quiz generation |
| `/api/v1/marketing/*` | `marketing-service` | `http://marketing-service:8002` | Landing pages, marketing & email campaigns |
| `/uploads/*` | Nginx Static | `/app/uploads/` | User avatar, course thumbnail, attachment storage |
| `/health` | Nginx / Gateway | Internal | System liveness & health inspection |
