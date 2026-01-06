// API service module for BioDockify pharmaceutical research platform
// All API calls are relative - the gateway handles routing

const API_BASE = '/api/v1';

export interface ResearchStatus {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: number;
  logs: string[];
  phase: string;
}

export interface ResearchResults {
  taskId: string;
  title: string;
  stats: {
    papers: number;
    entities: number;
    nodes: number;
    connections: number;
  };
  entities: {
    drugs: string[];
    diseases: string[];
    proteins: string[];
  };
  summary: string;
}

export interface ProtocolRequest {
  taskId: string;
  type: 'liquid-handler' | 'crystallization' | 'assay';
}

export interface ReportRequest {
  taskId: string;
  template: 'full' | 'summary' | 'executive';
}

export interface Settings {
  project: {
    name: string;
    type: string;
    disease_context: string;
    stage: string;
  };
  agent: {
    mode: 'assisted' | 'semi-autonomous' | 'autonomous';
    reasoning_depth: 'shallow' | 'standard' | 'deep';
    self_correction: boolean;
    max_retries: number;
    failure_policy: 'ask_user' | 'auto_retry' | 'abort';
  };
  literature: {
    sources: string[]; // ['pubmed', 'europe_pmc', 'openalex']
    enable_crossref: boolean;
    enable_preprints: boolean;
    year_range: number;
    novelty_strictness: 'low' | 'medium' | 'high';
  };
  ai_provider: {
    mode: 'auto' | 'ollama' | 'z-ai';
    ollama_url?: string;
    ollama_model?: string;
    zai_key?: string;

    // Legacy support (optional)
    primary_model?: string;
  };
  database?: { // Keep legacy support for now or move to 'execution'
    host: string;
    user: string;
    password: string;
  };
}

export interface ConnectionTest {
  type: 'llm' | 'database' | 'elsevier';
  status: 'success' | 'error';
  message: string;
}

// Helper function for API calls
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export const api = {
  // Research endpoints
  startResearch: (topic: string, mode: 'search' | 'synthesize' | 'write' = 'synthesize', taskId?: string) =>
    apiRequest<{ taskId: string, status: string, result: string, provider: string }>('/research', {
      method: 'POST',
      body: JSON.stringify({ topic, mode, taskId }),
    }),

  getStatus: (taskId: string) =>
    apiRequest<ResearchStatus>(`/research/${taskId}/status`),

  getResults: (taskId: string) =>
    apiRequest<ResearchResults>(`/research/${taskId}/results`),

  cancelResearch: (taskId: string) =>
    apiRequest<{ success: boolean }>(`/research/${taskId}/cancel`, {
      method: 'POST',
    }),

  // Lab interface endpoints
  generateProtocol: (request: ProtocolRequest) =>
    apiRequest<{ url: string; filename: string }>('/lab/protocol', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  generateReport: (request: ReportRequest) =>
    apiRequest<{ url: string; filename: string }>('/lab/report', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getRecentExports: () =>
    apiRequest<{ id: string; type: string; filename: string; createdAt: string }[]>('/lab/exports'),

  exportResult: (format: 'pdf' | 'docx' | 'xlsx', data: any) =>
    apiRequest<{ path: string }>('/export', {
      method: 'POST',
      body: JSON.stringify({ format, data }),
    }),

  checkCompliance: (text: string) =>
    apiRequest<{ compliant: boolean, scores: any, issues: any[] }>('/compliance/check', {
      method: 'POST',
      body: JSON.stringify({ text })
    }),

  // Settings endpoints
  testConnection: (serviceType: 'llm' | 'elsevier', provider?: string, key?: string) =>
    apiRequest<ConnectionTest>('/settings/test', {
      method: 'POST',
      body: JSON.stringify({ service_type: serviceType, provider, key })
    }),

  checkOllama: (baseUrl: string) =>
    apiRequest<{ status: string, message: string, models: string[] }>('/settings/ollama/check', {
      method: 'POST',
      body: JSON.stringify({ base_url: baseUrl })
    }),

  getSettings: () =>
    apiRequest<Settings>('/settings'),

  saveSettings: (settings: Settings) =>
    apiRequest<{ success: boolean }>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  resetSettings: () =>
    apiRequest<{ success: boolean; config: Settings }>('/settings/reset', {
      method: 'POST',
    }),

  // History endpoints
  getResearchHistory: () =>
    apiRequest<{ id: string; topic: string; status: string; createdAt: string }[]>('/research/history'),
};

export default api;
