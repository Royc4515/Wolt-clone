export const PLACEHOLDER_COLORS = [
  '#0a1a2e','#1a0a2e','#0a2e1a','#2e0a0a',
  '#0a2e2e','#2e1a0a','#1a2e0a','#2e2e0a',
];

export function hashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_COLORS[h % PLACEHOLDER_COLORS.length];
}
