export interface Lens {
  id: string;
  name: string;
  isSupported: (contentType: string, body: string) => boolean;
  priority: number;
}

export const lenses: Lens[] = [
  {
    id: 'json',
    name: 'JSON',
    isSupported: (ct) => ct.includes('json') || ct.includes('javascript'),
    priority: 10,
  },
  {
    id: 'image',
    name: 'Image',
    isSupported: (ct) => ct.startsWith('image/'),
    priority: 20,
  },
  {
    id: 'html',
    name: 'HTML',
    isSupported: (ct) => ct.includes('html'),
    priority: 10,
  },
  {
    id: 'xml',
    name: 'XML',
    isSupported: (ct) => ct.includes('xml'),
    priority: 10,
  },
  {
    id: 'raw',
    name: 'Raw',
    isSupported: () => true,
    priority: 0,
  },
];

export function getSuitableLenses(contentType: string, body: string): Lens[] {
  const ct = contentType.toLowerCase();
  const supported = lenses.filter(l => l.isSupported(ct, body));
  supported.sort((a, b) => b.priority - a.priority);
  return supported;
}
