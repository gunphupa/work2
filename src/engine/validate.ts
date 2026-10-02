import type { Flow, Text } from '@/types/diagnostic';
export function validateFlow(flow: Flow): string[] {
  const errors: string[] = [];
  const ids = new Set(flow.nodes.map((n) => n.id));
  const causes = new Set(flow.causes.map((c) => c.id));
  if (ids.size !== flow.nodes.length) errors.push('Duplicate node IDs');
  if (causes.size !== flow.causes.length) errors.push('Duplicate cause IDs');
  if (!ids.has(flow.start)) errors.push('Missing start node');
  function checkText(text: Text | undefined) {
    if (!text?.en?.trim() || !text?.th?.trim()) errors.push('Missing translation');
  }
  checkText(flow.title);
  checkText(flow.description);
  checkText(flow.time);
  flow.symptoms.forEach(checkText);
  flow.causes.forEach((c) => checkText(c.title));
  const edges = new Map<string, string[]>();
  for (const node of flow.nodes) {
    checkText(node.title);
    checkText(node.why);
    const destinations: string[] = [];
    if (node.kind === 'question') {
      node.guide.forEach(checkText);
      if (!node.guide.length) errors.push(`Missing guide: ${node.id}`);
      if (
        !node.options.some((o) => o.id === 'unsure') ||
        !node.options.some((o) => o.id === 'other')
      )
        errors.push(`Missing unsure/other: ${node.id}`);
      if (new Set(node.options.map((o) => o.id)).size !== node.options.length)
        errors.push(`Duplicate options: ${node.id}`);
      for (const option of node.options) {
        checkText(option.label);
        destinations.push(option.next);
        option.effects?.forEach((e) => {
          if (!causes.has(e.cause)) errors.push(`Unknown cause: ${e.cause}`);
        });
      }
      if (node.input === 'range') {
        if (!node.ranges?.length || node.ranges.at(-1)?.max !== node.max)
          errors.push(`Incomplete ranges: ${node.id}`);
        node.ranges?.forEach((r) => {
          if (!node.options.some((o) => o.id === r.option))
            errors.push(`Unknown range option: ${r.option}`);
        });
      }
    } else {
      node.steps.forEach(checkText);
      checkText(node.verify);
      checkText(node.undo);
      if (!causes.has(node.cause)) errors.push(`Unknown cause: ${node.cause}`);
      if (node.risk === 'caution') checkText(node.warning);
      if (!node.steps.length) errors.push(`Empty fix: ${node.id}`);
      destinations.push(node.onFailure);
    }
    edges.set(node.id, destinations);
    destinations.forEach((d) => {
      if (!['unresolved', 'safety_stop'].includes(d) && !ids.has(d))
        errors.push(`Missing target: ${d}`);
    });
  }
  const visited = new Set<string>();
  const visiting = new Set<string>();
  let hasFallback = false;
  function visit(id: string) {
    if (id === 'unresolved' || id === 'safety_stop') {
      hasFallback = true;
      return;
    }
    if (visiting.has(id)) {
      errors.push(`Cycle: ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    (edges.get(id) ?? []).forEach(visit);
    visiting.delete(id);
    visited.add(id);
  }
  visit(flow.start);
  ids.forEach((id) => {
    if (!visited.has(id)) errors.push(`Unreachable node: ${id}`);
  });
  if (!hasFallback) errors.push('Missing fallback');
  return errors;
}
