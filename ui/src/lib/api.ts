// API Service Layer for BioDockify Pharmaceutical Research Platform

const API_BASE = '/api';

export const researchAPI = {
  // Start a new research session
  startResearch: async (topic: string) => {
    const response = await fetch(`${API_BASE}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (!response.ok) throw new Error('Failed to start research');
    return response.json();
  },

  // Get all research sessions
  getSessions: async () => {
    const response = await fetch(`${API_BASE}/research`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  // Get research status by task ID
  getStatus: async (taskId: string) => {
    const response = await fetch(`${API_BASE}/research/${taskId}`);
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  },

  // Update research status
  updateStatus: async (taskId: string, updates: any) => {
    const response = await fetch(`${API_BASE}/research/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },

  // Get research results
  getResults: async (taskId: string) => {
    const response = await fetch(`${API_BASE}/research/${taskId}/results`);
    if (!response.ok) throw new Error('Failed to fetch results');
    return response.json();
  },

  // Add a log entry
  addLog: async (taskId: string, level: string, message: string) => {
    const response = await fetch(`${API_BASE}/research/${taskId}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message }),
    });
    if (!response.ok) throw new Error('Failed to add log');
    return response.json();
  },

  // Get logs
  getLogs: async (taskId: string, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE}/research/${taskId}/logs?${params}`);
    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
  },
};

export const labAPI = {
  // Generate protocol
  generateProtocol: async (taskId: string, type: string) => {
    const response = await fetch(`${API_BASE}/lab/protocol`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, type }),
    });
    if (!response.ok) throw new Error('Failed to generate protocol');
    return response.json();
  },

  // Generate report
  generateReport: async (taskId: string, template: string, includeSections: string[]) => {
    const response = await fetch(`${API_BASE}/lab/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, template, includeSections }),
    });
    if (!response.ok) throw new Error('Failed to generate report');
    return response.json();
  },
};

export const settingsAPI = {
  // Get settings
  getSettings: async () => {
    const response = await fetch(`${API_BASE}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  // Save settings
  saveSettings: async (settings: any) => {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to save settings');
    return response.json();
  },

  // Test connection
  testConnection: async (type: string) => {
    const response = await fetch(`${API_BASE}/settings/test/${type}`);
    if (!response.ok) throw new Error('Failed to test connection');
    return response.json();
  },
};

export default {
  research: researchAPI,
  lab: labAPI,
  settings: settingsAPI,
};
