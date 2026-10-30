import type { RepairTask, CreateTaskInput } from '../types';
import { reportsService } from './reportsService';
import { apiClient, isMockMode } from './apiClient';

const TASKS_STORAGE_KEY = 'potholefix_mock_tasks_v4';

// Initially empty so all 3 seeded reports can be triaged and dispatched fresh
const INITIAL_SEED_TASKS: RepairTask[] = [];

// --- Mock In-Memory / LocalStorage Repository ---
function getStoredTasks(): RepairTask[] {
  try {
    if (typeof localStorage === 'undefined') return INITIAL_SEED_TASKS;
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_TASKS));
      return INITIAL_SEED_TASKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SEED_TASKS;
  }
}

function saveStoredTasks(tasks: RepairTask[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Browser storage quota reached. Falling back to memory.', e);
  }
}

const MockTasksRepository = {
  async getAllTasks(): Promise<RepairTask[]> {
    return getStoredTasks();
  },

  async getTasksForTeam(teamId: string): Promise<RepairTask[]> {
    const tasks = getStoredTasks();
    return tasks.filter((t) => t.assignedTeamId === teamId);
  },

  async getMyTasks(teamId?: string): Promise<RepairTask[]> {
    return getStoredTasks().filter((t) => (teamId ? t.assignedTeamId === teamId : t.assignedTeamId === 'team-04'));
  },

  async getPendingApprovals(): Promise<RepairTask[]> {
    const tasks = getStoredTasks();
    return tasks.filter((t) => t.status === 'AWAITING_APPROVAL');
  },

  async getApprovalQueue(): Promise<RepairTask[]> {
    return this.getPendingApprovals();
  },

  async getTaskById(taskId: string): Promise<RepairTask | undefined> {
    const tasks = getStoredTasks();
    return tasks.find((t) => t.id === taskId || t.reportId === taskId);
  },

  async startTask(taskId: string, actorName = 'Gurpreet Singh'): Promise<RepairTask> {
    const tasks = getStoredTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task #${taskId} not found`);

    const current = tasks[index];
    const updatedTask: RepairTask = {
      ...current,
      status: 'IN_PROGRESS',
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    tasks[index] = updatedTask;
    saveStoredTasks(tasks);

    await reportsService.updateReportStatus(
      current.reportId,
      'IN_PROGRESS',
      'Repair crew arrived on site. Compaction work started.',
      actorName
    );

    return updatedTask;
  },

  async submitCompletion(
    taskId: string,
    afterRepairPhotoUrl: string,
    notes?: string,
    actorName = 'Gurpreet Singh'
  ): Promise<RepairTask> {
    const tasks = getStoredTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task #${taskId} not found`);

    const current = tasks[index];
    const updatedTask: RepairTask = {
      ...current,
      status: 'AWAITING_APPROVAL',
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      afterRepairPhotoUrl,
      repairNotes: notes,
    };

    tasks[index] = updatedTask;
    saveStoredTasks(tasks);

    await reportsService.submitRepairCompletion(
      current.reportId,
      afterRepairPhotoUrl,
      notes,
      actorName
    );

    return updatedTask;
  },

  async resumeTask(taskId: string, actorName = 'Gurpreet Singh'): Promise<RepairTask> {
    const tasks = getStoredTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task #${taskId} not found`);

    const current = tasks[index];
    const updatedTask: RepairTask = {
      ...current,
      status: 'IN_PROGRESS',
    };

    tasks[index] = updatedTask;
    saveStoredTasks(tasks);

    await reportsService.updateReportStatus(
      current.reportId,
      'IN_PROGRESS',
      'Crew resumed field repair following rework instructions.',
      actorName
    );

    return updatedTask;
  },

  async createTask(input: CreateTaskInput): Promise<RepairTask> {
    const tasks = getStoredTasks();
    const workOrderNumber = `WO-${Math.floor(10000 + Math.random() * 90000)}`;

    const newTask: RepairTask = {
      id: workOrderNumber,
      reportId: input.reportId,
      trackingNumber: input.trackingNumber,
      assignedTeamId: input.assignedTeamId,
      assignedTeamName: input.assignedTeamName,
      status: 'PENDING',
      priority: input.priority,
      deadline: input.deadline,
      instructions: input.instructions,
      createdAt: new Date().toISOString(),
      location: input.location,
      damageImageUrl: input.damageImageUrl,
    };

    const updatedTasks = [newTask, ...tasks];
    saveStoredTasks(updatedTasks);

    await reportsService.updateReportStatus(
      input.reportId,
      'ASSIGNED',
      `Assigned to ${input.assignedTeamName} under Work Order #${workOrderNumber}.`,
      'Alice Sharma'
    );

    return newTask;
  },

  async reviewTask(
    taskId: string,
    approved: boolean,
    reworkReason?: string,
    actorName = 'Alice Sharma'
  ): Promise<{ task: RepairTask; notificationPayload?: unknown }> {
    const tasks = getStoredTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task #${taskId} not found`);

    const current = tasks[index];

    if (approved) {
      const updatedTask: RepairTask = {
        ...current,
        status: 'RESOLVED',
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      tasks[index] = updatedTask;
      saveStoredTasks(tasks);

      await reportsService.updateReportStatus(
        current.reportId,
        'RESOLVED',
        'Authority approved post-repair photographic evidence with Level-1 inspection pass.',
        actorName
      );

      const notificationPayload = {
        event: 'MUNICIPAL_REPAIR_RESOLVED',
        workOrderId: taskId,
        reportId: current.reportId,
        approvedBy: actorName,
        approvedAt: new Date().toISOString(),
        evidencePhotoUrl: current.afterRepairPhotoUrl,
      };

      return { task: updatedTask, notificationPayload };
    } else {
      if (!reworkReason) {
        throw new Error('Rejection and rework requests require an explicit reason.');
      }

      const updatedTask: RepairTask = {
        ...current,
        status: 'REWORK_REQUIRED',
        reworkReason,
      };
      tasks[index] = updatedTask;
      saveStoredTasks(tasks);

      await reportsService.updateReportStatus(
        current.reportId,
        'REWORK_REQUIRED',
        `Authority requested rework: ${reworkReason}`,
        actorName
      );

      return { task: updatedTask };
    }
  },
};

// --- Real HTTP Repository (Connects to FastAPI) ---
const HttpTasksRepository = {
  async getAllTasks(): Promise<RepairTask[]> {
    return apiClient.get<RepairTask[]>('/authority/tasks');
  },

  async getTasksForTeam(teamId: string): Promise<RepairTask[]> {
    return apiClient.get<RepairTask[]>(`/tasks?assigned_team_id=${encodeURIComponent(teamId)}`);
  },

  async getMyTasks(teamId?: string): Promise<RepairTask[]> {
    return apiClient.get<RepairTask[]>(teamId ? `/tasks/my?team_id=${encodeURIComponent(teamId)}` : '/tasks/my');
  },

  async getPendingApprovals(): Promise<RepairTask[]> {
    return apiClient.get<RepairTask[]>('/authority/approvals');
  },

  async getApprovalQueue(): Promise<RepairTask[]> {
    return this.getPendingApprovals();
  },

  async getTaskById(taskId: string): Promise<RepairTask | undefined> {
    return apiClient.get<RepairTask>(`/tasks/${taskId}`);
  },

  async startTask(taskId: string): Promise<RepairTask> {
    return apiClient.patch<RepairTask>(`/tasks/${taskId}/start`);
  },

  async submitCompletion(
    taskId: string,
    afterRepairPhotoUrl: string,
    notes?: string,
    _actorName?: string,
    imageFile?: File
  ): Promise<RepairTask> {
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
      if (notes) formData.append('repair_notes', notes);
      return apiClient.upload<RepairTask>(`/tasks/${taskId}/completion`, formData);
    }

    return apiClient.post<RepairTask>(`/tasks/${taskId}/completion`, {
      after_repair_photo_url: afterRepairPhotoUrl,
      repair_notes: notes,
    });
  },

  async resumeTask(taskId: string): Promise<RepairTask> {
    return apiClient.patch<RepairTask>(`/tasks/${taskId}/start`);
  },

  async createTask(input: CreateTaskInput): Promise<RepairTask> {
    return apiClient.post<RepairTask>('/tasks', {
      report_id: input.reportId,
      tracking_number: input.trackingNumber,
      assigned_team_id: input.assignedTeamId,
      assigned_team_name: input.assignedTeamName,
      priority: input.priority,
      deadline: input.deadline,
      instructions: input.instructions,
    });
  },

  async reviewTask(
    taskId: string,
    approved: boolean,
    reworkReason?: string
  ): Promise<{ task: RepairTask; notificationPayload?: unknown }> {
    const response = await apiClient.patch<{ task: RepairTask; notification_payload?: unknown }>(
      `/tasks/${taskId}/review`,
      {
        approved,
        rework_reason: reworkReason,
      }
    );

    return {
      task: response.task || (response as unknown as RepairTask),
      notificationPayload: response.notification_payload,
    };
  },
};

// --- Unified Tasks Service Interface ---
export const tasksService = {
  async getAllTasks(): Promise<RepairTask[]> {
    return isMockMode() ? MockTasksRepository.getAllTasks() : HttpTasksRepository.getAllTasks();
  },

  async getTasksForTeam(teamId: string): Promise<RepairTask[]> {
    return isMockMode()
      ? MockTasksRepository.getTasksForTeam(teamId)
      : HttpTasksRepository.getTasksForTeam(teamId);
  },

  async getMyTasks(teamId?: string): Promise<RepairTask[]> {
    return isMockMode() ? MockTasksRepository.getMyTasks(teamId) : HttpTasksRepository.getMyTasks(teamId);
  },

  async getPendingApprovals(): Promise<RepairTask[]> {
    return isMockMode()
      ? MockTasksRepository.getPendingApprovals()
      : HttpTasksRepository.getPendingApprovals();
  },

  async getApprovalQueue(): Promise<RepairTask[]> {
    return isMockMode()
      ? MockTasksRepository.getApprovalQueue()
      : HttpTasksRepository.getApprovalQueue();
  },

  async getTaskById(taskId: string): Promise<RepairTask | undefined> {
    return isMockMode()
      ? MockTasksRepository.getTaskById(taskId)
      : HttpTasksRepository.getTaskById(taskId);
  },

  async startTask(taskId: string, actorName = 'Gurpreet Singh (Crew Lead)'): Promise<RepairTask> {
    return isMockMode()
      ? MockTasksRepository.startTask(taskId, actorName)
      : HttpTasksRepository.startTask(taskId);
  },

  async submitCompletion(
    taskId: string,
    afterRepairPhotoUrl: string,
    notes?: string,
    actorName = 'Gurpreet Singh (Crew Lead)',
    imageFile?: File
  ): Promise<RepairTask> {
    return isMockMode()
      ? MockTasksRepository.submitCompletion(taskId, afterRepairPhotoUrl, notes, actorName)
      : HttpTasksRepository.submitCompletion(taskId, afterRepairPhotoUrl, notes, actorName, imageFile);
  },

  async resumeTask(taskId: string, actorName = 'Gurpreet Singh (Crew Lead)'): Promise<RepairTask> {
    return isMockMode()
      ? MockTasksRepository.resumeTask(taskId, actorName)
      : HttpTasksRepository.resumeTask(taskId);
  },

  async createTask(input: CreateTaskInput): Promise<RepairTask> {
    return isMockMode() ? MockTasksRepository.createTask(input) : HttpTasksRepository.createTask(input);
  },

  async reviewTask(
    taskId: string,
    approved: boolean,
    reworkReason?: string,
    actorName = 'Alice Sharma'
  ): Promise<{ task: RepairTask; notificationPayload?: unknown }> {
    return isMockMode()
      ? MockTasksRepository.reviewTask(taskId, approved, reworkReason, actorName)
      : HttpTasksRepository.reviewTask(taskId, approved, reworkReason);
  },

  resetDemoTasks(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_TASKS));
    }
  },
};
