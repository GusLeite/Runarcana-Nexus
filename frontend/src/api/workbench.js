import { request } from './auth.js'

// Bancada de fabricação: { gold, rule, recipes: [{ key, name, craftId, craftName, level, dcs, values, tiers, bonus,
// masterworkAt, component, time, description, natural20, craftable, note, ... }] }.
export const fetchWorkbench = token => request('/character/me/workbench', { token })

// Fabrica (o back rola o d20): { d20, bonus, total, dc, outcome: MASTERWORK|SUCCESS|FAILED|RUINED, cost, refund, item, sheet }.
export const craftFormula = (token, key, tier) =>
  request('/character/me/workbench/craft', { method: 'POST', token, body: { key, tier } })
