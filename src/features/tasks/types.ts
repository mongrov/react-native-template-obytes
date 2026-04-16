export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskListCategory = 'new' | 'inProgress' | 'upcoming' | 'completed';

export type TaskCustomer = {
  name: string;
  contact: string;
  phone: string;
};

export type TaskSchedule = {
  scheduled: string;
  duration: string;
  earliestStart: string;
};

/** Row shown on the task list (LuminX-style). */
export type TaskListItem = {
  id: string;
  title: string;
  time: string;
  period: string;
  duration: string;
  location: string;
  address?: string;
  priority: TaskPriority;
  description?: string;
  schedule?: TaskSchedule;
  customer?: TaskCustomer;
  status?: string;
  timeContext?: string;
  completedAt?: string;
};

export type TaskDetailCustomer = TaskCustomer & {
  initials: string;
  email?: string;
};

export type TaskAssignment = {
  assignedTo: string;
  team: string;
  territory: string;
};

export type TaskEquipment = { name: string; icon: 'briefcase' | 'clock' | 'wrench' };

export type TaskActivity = { text: string; time: string };

export type TaskDetailSchedule = {
  scheduledStart?: { time: string; date: string };
  scheduledEnd?: { time: string; duration: string };
  actualStart?: { time: string; note: string };
  earliestTime?: { time: string; note: string };
  scheduled: string;
  duration: string;
  earliestStart: string;
};

/** Full task for detail screen. */
export type TaskDetail = {
  id: string;
  title: string;
  status: string;
  priority: TaskPriority;
  time: string;
  period: string;
  duration: string;
  startedAt?: string;
  estimatedCompletion?: string;
  location: string;
  address?: string;
  description: string;
  customer: TaskDetailCustomer;
  assignment?: TaskAssignment;
  equipment?: TaskEquipment[];
  schedule: TaskDetailSchedule;
  activity: TaskActivity[];
};

export type TaskStats = {
  new: number;
  inProgress: number;
  done: number;
  total: number;
  completed: number;
  completedPercent: number;
};

export type SummaryFilter = 'new' | 'inProgress' | 'done' | null;
