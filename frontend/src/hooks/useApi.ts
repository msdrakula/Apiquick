const API_BASE = '';

async function readError(res: Response) {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json.error || json.detail || text || res.statusText;
  } catch {
    return text || res.statusText;
  }
}

async function parseJson(res: Response) {
  if (!res.ok) throw new Error(await readError(res));
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  return parseJson(res);
}

export async function apiPost(path: string, body?: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseJson(res);
}

export async function apiPut(path: string, body?: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseJson(res);
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  return parseJson(res);
}
