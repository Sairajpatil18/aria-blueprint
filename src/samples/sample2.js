/** Sample blueprint: Chat application */
export const sample2 = {
  id: 'sample-2',
  title: 'Chat App',
  nodes: [
    { id: 'frontend', type: 'component', label: 'React Frontend', x: 80, y: 80 },
    { id: 'ws', type: 'service', label: 'WebSocket Server', x: 280, y: 80 },
    { id: 'backend', type: 'service', label: 'Node Backend', x: 280, y: 280 },
    { id: 'db', type: 'database', label: 'MongoDB', x: 80, y: 280 },
    { id: 'openai', type: 'service', label: 'OpenAI API', x: 480, y: 180 },
    { id: 'cache', type: 'service', label: 'Redis Cache', x: 480, y: 280 },
    { id: 'notifications', type: 'service', label: 'Push Notifications', x: 680, y: 200 },
  ],
  edges: [
    { from: 'frontend', to: 'ws' },
    { from: 'ws', to: 'backend' },
    { from: 'backend', to: 'db' },
    { from: 'backend', to: 'openai' },
    { from: 'backend', to: 'cache' },
    { from: 'frontend', to: 'notifications' },
    { from: 'openai', to: 'cache' },
  ],
}