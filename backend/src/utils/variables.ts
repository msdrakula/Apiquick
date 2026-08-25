import { generateBuiltinVariables, newGuid } from './generators';
import { makeCounterCtx } from './counters';

export type CounterCtx = { value: (name: string) => string };

export function replaceVariables(
  text: string,
  variables: Record<string, string>,
  counters?: CounterCtx
): string {
  if (!text) return text;
  let result = text;
  result = result.replace(/\{\{\$(guid|uuid|randomUUID)\}\}/gi, () => newGuid());
  result = result.replace(/\{\{\$counter(?::([A-Za-z0-9_.-]+))?\}\}/g, (_m, name) => {
    return (counters || makeCounterCtx(false)).value(name || 'default');
  });
  for (const [key, value] of Object.entries(variables)) {
    if (!key) continue;
    result = result.split(`{{${key}}}`).join(String(value));
  }
  return result;
}

export function buildVariables(envId: number | null, envs: any[]): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!envId) return vars;
  const env = envs.find((e: any) => e.id === envId);
  if (env && env.variables) {
    for (const v of env.variables) {
      if (v.enabled !== false) vars[v.key] = v.value;
    }
  }
  return vars;
}

export function getPredefinedVariables(): Record<string, string> {
  return generateBuiltinVariables();
}

export function makeExecuteCounters(increment: boolean) {
  return makeCounterCtx(increment);
}
