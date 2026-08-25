/**
 * Bruno Query Language (BQL) — lightweight object-path navigator
 * Extracted from @usebruno/query (MIT licensed)
 *
 * Usage:
 *   get(data, 'customer.orders.items.amount')
 *   get(data, '..items.amount')              // deep search
 *   get(data, '..items[0].amount')           // array index
 *   get(data, '..items[?].amount', i => i > 20) // filter
 *   get(data, '..items[?]', { id: 2 })       // object predicate
 */

function normalize(value: any) {
  if (!Array.isArray(value)) return value;
  const values = [] as any[];
  value.forEach((item) => {
    const v = normalize(item);
    if (v != null) {
      values.push(...(Array.isArray(v) ? v : [v]));
    }
  });
  return values.length ? values : undefined;
}

function getValue(source: any, prop: string, deep = false): any {
  if (typeof source !== 'object') return;
  let value;
  if (Array.isArray(source)) {
    value = source.map((item) => getValue(item, prop, deep));
  } else {
    value = source[prop];
    if (deep) {
      value = [value];
      for (const [key, item] of Object.entries(source)) {
        if (key !== prop && typeof item === 'object') {
          value.push(getValue(source[key], prop, deep));
        }
      }
    }
  }
  return normalize(value);
}

type PredicateOrMapper = ((obj: any) => any) | Record<string, any>;

function objectPredicate(obj: Record<string, any>) {
  return (item: any) => {
    for (const [key, value] of Object.entries(obj)) {
      if (item[key] !== value) return false;
    }
    return true;
  };
}

function filterOrMap(source: any, funOrObj: PredicateOrMapper) {
  const fun = typeof funOrObj === 'object' ? objectPredicate(funOrObj) : funOrObj;
  const isArray = Array.isArray(source);
  const list = isArray ? source : [source];
  const result = [] as any[];
  for (const item of list) {
    if (item == null) continue;
    const value = fun(item);
    if (value === true) {
      result.push(item);
    } else if (value != null && value !== false) {
      result.push(value);
    }
  }
  return normalize(isArray ? result : result[0]);
}

export function get(source: any, path: string, ...fns: PredicateOrMapper[]) {
  const paths = path
    .replace(/\s+/g, '')
    .split(/(\.{1,2}|\[\?\]|\[\d+\])/g)
    .filter((s) => s.length > 0)
    .map((str) => {
      str = str.replace(/\[|\]/g, '');
      const index = parseInt(str);
      return isNaN(index) ? str : index;
    });

  let index = 0,
    lookbehind = '' as string | number,
    funIndex = 0;

  while (source != null && index < paths.length) {
    const token = paths[index++];
    switch (true) {
      case token === '..':
      case token === '.':
        break;
      case token === '?':
        const fun = fns[funIndex++];
        if (fun == null) throw new Error(`missing function for ${lookbehind}`);
        source = filterOrMap(source, fun);
        break;
      case typeof token === 'number':
        source = normalize(source[token]);
        break;
      default:
        source = getValue(source, token as string, lookbehind === '..');
    }
    lookbehind = token;
  }

  return source;
}
