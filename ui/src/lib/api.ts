// API service module for BioDockify pharmaceutical research platform
// All API calls are relative - the gateway handles routing

const API_BASE = 'http://localhost:8000/api';

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
    sources: string[];
    enable_crossref: boolean;
    enable_preprints: boolean;
    year_range: number;
    novelty_strictness: 'low' | 'medium' | 'high';
  };
  ai_provider: {
    mode: 'auto' | 'ollama' | 'z-ai';
    ollama_url?: string;
    ollama_model?: string;
    google_key?: string;
    huggingface_key?: string;
    openrouter_key?: string;
    glm_key?: string;
    elsevier_key?: string;
    pubmed_email?: string;
  };
  // New V2 Schema Additions
  pharma: {
    enable_pubtator: boolean;
    enable_semantic_scholar: boolean;
    enable_unpaywall: boolean;
    citation_threshold: 'low' | 'medium' | 'high';
    sources: {
      pubmed: boolean;
      pmc: boolean;
      biorxiv: boolean;
      chemrxiv: boolean;
      clinicaltrials: boolean;
      google_scholar: boolean;
      openalex: boolean;
      semantic_scholar: boolean;
      ieee: boolean;
      elsevier: boolean;
      scopus: boolean;
      wos: boolean;
      science_index: boolean;
    };
  };
  ai_advanced: {
    context_window: number;
    gpu_layers: number;
    thread_count: number;
    // Add missing optional settings to prevent build errors if referenced elsewhere
    provider?: string;
    endpoint?: string;
    key?: string;
  };
  persona: {
    role: 'PhD Student' | 'PG Student' | 'Senior Researcher' | 'Industry Scientist';
    strictness: 'exploratory' | 'balanced' | 'conservative';
    introduction: string;
    research_focus: string;
  };
  output: {
    format: 'markdown' | 'pdf' | 'docx' | 'latex';
    citation_style: 'apa' | 'nature' | 'ieee' | 'chicago';
    include_disclosure: boolean;
    output_dir: string;
  };
  system: {
    auto_start: boolean;
    minimize_to_tray: boolean;
    pause_on_battery: boolean;
    max_cpu_percent: number;
  };
}

export interface ConnectionTest {
  type: 'llm' | 'database' | 'elsevier';
  status: 'success' | 'error';
  message: string;
}

export interface SystemInfo {
  os: string;
  cpu_cores: number;
  ram_total_gb: number;
  ram_available_gb: number;
  disk_free_gb: number;
  temp_writable: boolean;
  python_version: string;
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
    apiRequest<{ taskId: string, status: string, result: string, provider: string }>('/research/start', {
      method: 'POST',
      body: JSON.stringify({ topic, mode, taskId }),
    }),

  getStatus: (taskId: string) =>
    apiRequest<ResearchStatus>(`/research/status/${taskId}`),


  getResults: (taskId: string) =>
    apiRequest<ResearchResults>(`/research/${taskId}/results`),

  agentChat: (message: string) =>
    apiRequest<{ reply: string }>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

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

  checkNeo4j: (uri: string, user: string, pass: string) =>
    apiRequest<{ status: string; message: string }>('/settings/neo4j/check', {
      checkOllama: (baseUrl: string) =>
        apiRequest<{ status: string; models: string[]; message?: string }>(`/settings/ollama/check`, {
          method: 'POST',
          body: JSON.stringify({ base_url: baseUrl })
        }),

      checkNeo4j: (uri: string, user: string, password: string) =>
        apiRequest<{ status: string; message: string }>(`/settings/neo4j/check`, {
          method: 'POST',
          body: JSON.stringify({ uri, user, password })
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

      getSystemInfo: () =>
        apiRequest<SystemInfo>('/system/info'),

      // History endpoints
      getResearchHistory: () =>
        apiRequest<{ id: string; topic: string; status: string; createdAt: string }[]>('/research/history'),
    };

  export default api;
