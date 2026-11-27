/** Sample blueprint: E-commerce store */
export const sample3 = {
  id: 'sample-3',
  title: 'E-commerce',
  nodes: [
    { id: 'storefront', type: 'component', label: 'React Storefront', x: 100, y: 100 },
    { id: 'api', type: 'service', label: 'Node API', x: 300, y: 100 },
    { id: 'payments', type: 'service', label: 'Stripe', x: 500, y: 100 },
    { id: 'inventory', type: 'database', label: 'Inventory DB', x: 300, y: 300 },
    { id: 'users', type: 'database', label: 'Users DB', x: 100, y: 300 },
    { id: 'email', type: 'service', label: 'Email Service', x: 500, y: 300 },
    { id: 'cdn', type: 'service', label: 'Asset CDN', x: 700, y: 200 },
  ],
  edges: [
    { from: 'storefront', to: 'api' },
    { from: 'api', to: 'payments' },
    { from: 'api', to: 'inventory' },
    { from: 'api', to: 'users' },
    { from: 'api', to: 'email' },
    { from: 'storefront', to: 'cdn' },
    { from: 'inventory', to: 'email' },
  ],
}