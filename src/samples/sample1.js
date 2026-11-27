/** Sample blueprint: Simple todo app */
export const sample1 = {
  id: 'sample-1',
  title: 'Todo App',
  nodes: [
    { id: 'frontend', type: 'component', label: 'React UI', x: 100, y: 100 },
    { id: 'api', type: 'service', label: 'Node API', x: 300, y: 100 },
    { id: 'db', type: 'database', label: 'PostgreSQL', x: 300, y: 300 },
    { id: 'auth', type: 'service', label: 'Auth Service', x: 100, y: 300 },
    { id: 'queue', type: 'service', label: 'Redis Queue', x: 500, y: 200 },
    { id: 'cdn', type: 'service', label: 'CDN', x: 700, y: 100 },
    { id: 'monitor', type: 'service', label: 'Status Page', x: 700, y: 300 },
  ],
  edges: [
    { from: 'frontend', to: 'api' },
    { from: 'api', to: 'db' },
    { from: 'api', to: 'queue' },
    { from: 'auth', to: 'api' },
    { from: 'queue', to: 'api' },
    { from: 'frontend', to: 'cdn' },
    { from: 'api', to: 'monitor' },
  ],
}