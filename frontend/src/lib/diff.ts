export function lineDiff(a: string, b: string): Array<{ type: 'same' | 'add' | 'del'; text: string }> {
  const left = (a || '').split('\n');
  const right = (b || '').split('\n');
  const rows: Array<{ type: 'same' | 'add' | 'del'; text: string }> = [];
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) {
    const L = left[i];
    const R = right[i];
    if (L === R) rows.push({ type: 'same', text: R ?? L ?? '' });
    else {
      if (L != null) rows.push({ type: 'del', text: L });
      if (R != null) rows.push({ type: 'add', text: R });
    }
  }
  return rows;
}
