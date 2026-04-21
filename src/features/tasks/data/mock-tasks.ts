import type {
  TaskDetail,
  TaskListItem,
  TaskStats,
} from '@/features/tasks/types';

const desc  = 'Emergency repair needed for fire sprinkler system in main lobby. Water leaking from ceiling mount, requires immediate attention to prevent water damage and ensure fire safety compliance.';

const customer = {
  name: 'Downtown Properties LLC',
  contact: 'Sarah Mitchell',
  phone: '(512) 555-0198',
};

export const mockTaskGroups: {
  new: TaskListItem[];
  inProgress: TaskListItem[];
  upcoming: TaskListItem[];
  completed: TaskListItem[];
} = {
  new: [
    {
      id: 'FS0-2855',
      priority: 'high',
      title: 'Emergency Fire Sprinkler Repair',
      time: '2:30',
      period: 'PM',
      duration: '3h',
      location: 'Downtown Office Tower',
      address: '1200 Congress Ave Suite 800, Austin',
      description: desc,
      schedule: {
        scheduled: '2:30 PM - 5:30 PM',
        duration: '3h',
        earliestStart: '2:00 PM',
      },
      customer,
    },
    {
      id: 'FS0-2856',
      priority: 'medium',
      title: 'Access Control System Update',
      time: '4:00',
      period: 'PM',
      duration: '2h',
      location: 'Tech Park Campus',
      address: '3500 Innovation Blvd, Austin',
      description: desc,
      schedule: {
        scheduled: '4:00 PM - 6:00 PM',
        duration: '2h',
        earliestStart: '3:30 PM',
      },
      customer,
    },
    {
      id: 'FS0-2857',
      priority: 'high',
      title: 'Roof Inspection - Storm Damage',
      time: '5:30',
      period: 'PM',
      duration: '1.5h',
      location: 'Lakeside Condominiums',
      address: '7800 Lake Shore Dr, Austin',
      description: desc,
      schedule: {
        scheduled: '5:30 PM - 7:00 PM',
        duration: '1.5h',
        earliestStart: '5:00 PM',
      },
      customer,
    },
  ],
  inProgress: [
    {
      id: 'FSO-2841',
      status: 'In Progress',
      priority: 'medium',
      title: 'HVAC System Maintenance',
      time: '9:00',
      period: 'AM',
      duration: '2h',
      location: 'Oakwood Corporate Center',
      address: '4500 Oak Blvd Suite 200, Austin',
      timeContext: 'Started 48 min ago',
      description: desc,
      schedule: {
        scheduled: '9:00 AM - 11:00 AM',
        duration: '2h',
        earliestStart: '8:30 AM',
      },
      customer,
    },
    {
      id: 'FSO-2842',
      status: 'In Progress',
      priority: 'high',
      title: 'Elevator Safety Inspection',
      time: '11:30',
      period: 'AM',
      duration: '3h',
      location: 'Gateway Medical Plaza',
      address: '1500 Medical Dr, Austin',
      timeContext: 'Started 23 min ago',
      description: desc,
      schedule: {
        scheduled: '11:30 AM - 2:30 PM',
        duration: '3h',
        earliestStart: '11:00 AM',
      },
      customer,
    },
    {
      id: 'FSO-2843',
      status: 'In Progress',
      priority: 'medium',
      title: 'Plumbing Leak Repair',
      time: '10:00',
      period: 'AM',
      duration: '1.5h',
      location: 'Riverside Shopping Center',
      address: '3200 Riverside Dr, Austin',
      timeContext: 'Started 1h 15 min ago',
      description: desc,
      schedule: {
        scheduled: '10:00 AM - 11:30 AM',
        duration: '1.5h',
        earliestStart: '9:30 AM',
      },
      customer,
    },
  ],
  upcoming: [
    {
      id: 'FS0-2847',
      status: 'Not Started',
      priority: 'high',
      title: 'Security System Upgrade',
      time: '3:00',
      period: 'PM',
      duration: '2.5h',
      location: 'Tech Hub Building',
      address: '800 Innovation Way, Austin',
      description: desc,
      schedule: {
        scheduled: '3:00 PM - 5:30 PM',
        duration: '2.5h',
        earliestStart: '2:30 PM',
      },
      customer,
    },
    {
      id: 'FS0-2848',
      status: 'Not Started',
      priority: 'medium',
      title: 'Plumbing Leak Assessment',
      time: '1:15',
      period: 'PM',
      duration: '1.5h',
      location: 'Riverside Apartments',
      address: '890 River Rd Apt 304, Austin',
      description: desc,
      schedule: {
        scheduled: '1:15 PM - 2:45 PM',
        duration: '1.5h',
        earliestStart: '1:00 PM',
      },
      customer,
    },
  ],
  completed: [
    {
      id: 'FS0-2838',
      status: 'Done',
      priority: 'low',
      title: 'Routine Equipment Check',
      time: '7:00',
      period: 'AM',
      duration: '1h',
      location: 'Tech Solutions LLC',
      completedAt: 'Completed at 8:45 AM',
    },
    {
      id: 'FS0-2839',
      status: 'Done',
      priority: 'medium',
      title: 'Fire Alarm System Test',
      time: '6:00',
      period: 'AM',
      duration: '1.5h',
      location: 'Central High School',
      completedAt: 'Completed at 7:30 AM',
    },
  ],
};

function computeStats(): TaskStats {
  const n = mockTaskGroups.new.length;
  const p = mockTaskGroups.inProgress.length;
  const u = mockTaskGroups.upcoming.length;
  const c = mockTaskGroups.completed.length;
  const total = n + p + u + c;
  return {
    new: n,
    inProgress: p,
    done: c,
    total,
    completed: c,
    completedPercent: total ? Math.round((c / total) * 100) : 0,
  };
}

export const mockTaskStats = computeStats();

function flattenTasks(): TaskListItem[] {
  return [
    ...mockTaskGroups.new,
    ...mockTaskGroups.inProgress,
    ...mockTaskGroups.upcoming,
    ...mockTaskGroups.completed,
  ];
}

export function findListTaskById(id: string): TaskListItem | undefined {
  return flattenTasks().find(t => t.id === id);
}

/** Rich detail for primary demo task; others are synthesized from list rows. */
const detailOverrides: Record<string, Partial<TaskDetail>> = {
  'FSO-2841': {
    startedAt: '48 min ago',
    estimatedCompletion: '10:30 AM',
    customer: {
      name: 'Acme Manufacturing Inc.',
      contact: 'John Smith',
      phone: '(512) 555-0123',
      initials: 'AM',
      email: 'john.smith@acmemanufacturing.com',
    },
    assignment: {
      assignedTo: 'Mike Johnson',
      team: 'HVAC Maintenance Team',
      territory: 'Austin Central District',
    },
    equipment: [
      { name: 'HVAC Diagnostic Tool Kit', icon: 'briefcase' },
      { name: 'Refrigerant Gauge Set', icon: 'clock' },
      { name: 'Standard Tool Set', icon: 'wrench' },
    ],
    schedule: {
      scheduledStart: { time: '9:00 AM', date: 'Oct 15, 2025' },
      scheduledEnd: { time: '11:00 AM', duration: '2h' },
      actualStart: { time: '9:15 AM', note: '15 min late' },
      earliestTime: { time: '8:30 AM', note: 'Window opens' },
      scheduled: '9:00 AM – 11:00 AM',
      duration: '2h',
      earliestStart: '8:30 AM',
    },
    activity: [
      { text: 'Mike Johnson started the task', time: 'Today at 9:15 AM' },
      { text: 'Task assigned to Mike Johnson by System', time: 'Today at 8:45 AM' },
      { text: 'Task scheduled for Oct 15, 2025', time: 'Oct 10, 2025 at 2:30 PM' },
      { text: 'Task created by John Smith', time: 'Oct 10, 2025 at 2:15 PM' },
    ],
    description:
      'Comprehensive HVAC system inspection and maintenance. Check refrigerant levels, inspect electrical connections, clean filters, calibrate thermostat, and ensure optimal system performance.',
  },
};

export function getTaskDetail(id: string): TaskDetail | undefined {
  const row = findListTaskById(id);
  if (!row)
    return undefined;

  const extra = detailOverrides[id] ?? {};
  const locLine = row.address ? `${row.location}, ${row.address}` : row.location;

  return {
    id: row.id,
    title: row.title,
    status: row.status ?? (row.completedAt ? 'Done' : 'Open'),
    priority: row.priority,
    time: row.time,
    period: row.period,
    duration: row.duration,
    startedAt: row.timeContext ?? extra.startedAt,
    estimatedCompletion: extra.estimatedCompletion,
    location: locLine,
    address: row.address,
    description:
      extra.description
      ?? row.description
      ?? 'No description provided.',
    customer: extra.customer ?? {
      name: row.customer?.name ?? '—',
      contact: row.customer?.contact ?? '—',
      phone: row.customer?.phone ?? '—',
      initials: (row.customer?.name ?? '?')
        .split(' ')
        .map(s => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      email: undefined,
    },
    assignment: extra.assignment,
    equipment: extra.equipment,
    schedule: extra.schedule ?? {
      scheduled: row.schedule?.scheduled ?? `${row.time} ${row.period}`,
      duration: row.schedule?.duration ?? row.duration,
      earliestStart: row.schedule?.earliestStart ?? `${row.time} ${row.period}`,
    },
    activity: extra.activity ?? [
      { text: `Task ${row.id} updated`, time: 'Recently' },
    ],
  };
}
