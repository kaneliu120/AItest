export const apiService = {
  async checkHealth() {
    const res = await fetch('/api/health');
    return { success: res.ok };
  },
  async fetchTaskStats() {
    const res = await fetch('/api/tasks?action=stats');
    const json = await res.json().catch(() => ({}));
    return { success: res.ok, data: json.data || json };
  },
  async fetchAllTasks() {
    const res = await fetch('/api/tasks?action=list');
    const json = await res.json().catch(() => ({}));
    return { success: res.ok, data: json.data?.tasks || json.tasks || [] };
  },
  async addNewTask(taskData: { title: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'critical' }) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...taskData }),
    });
    const json = await res.json().catch(() => ({}));
    return { success: res.ok, data: json.data, error: json.error };
  },
  async updateTaskStatus(taskId: string, status: 'pending' | 'in-progress' | 'completed' | 'cancelled') {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id: taskId, status }),
    });
    const json = await res.json().catch(() => ({}));
    return { success: res.ok, data: json.data, error: json.error };
  },
  async batchTasks(action: 'complete' | 'delete' | 'status', ids: string[], status?: 'pending' | 'in-progress' | 'completed' | 'cancelled') {
    const res = await fetch('/api/tasks/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids, status }),
    });
    const json = await res.json().catch(() => ({}));
    return { success: res.ok, data: json.data, error: json.error };
  },
};
