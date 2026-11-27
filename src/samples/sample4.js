/** Sample blueprint: Task management tool */
export const sample4 = {
  id: 'sample-4',
  title: 'Task Manager',
  nodes: [
    { id: 'ui', type: 'component', label: 'Vue Interface', x: 90, y: 90 },
    { id: 'scheduler', type: 'service', label: 'Cron Scheduler', x: 290, y: 90 },
    { id: 'api', type: 'service', label: 'Go API', x: 290, y: 310 },
    { id: 'storage', type: 'database', label: 'S3 Storage', x: 90, y: 310 },
    { id: 'notifications', type: 'service', label: 'Slack Alerts', x: 490, y: 210 },
    { id: 'search', type: 'service', label: 'Algolia Search', x: 490, y: 310 },
    { id: 'metrics', type: 'service', label: 'Prometheus', x: 690, y: 210 },
  ],
  edges: [
    { from: 'ui', to: 'api' },
    { from: 'api', to: 'scheduler' },
    { from: 'api', to: 'storage' },
    { from: 'api', to: 'notifications' },
    { from: 'api', to: 'search' },
    { from: 'ui', to: 'metrics' },
    { from: 'search', to: 'notifications' },
  ],
}