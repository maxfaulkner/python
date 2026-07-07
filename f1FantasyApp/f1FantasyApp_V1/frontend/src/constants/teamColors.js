// Centralized F1 constructor color map (2026 season)
// Used across TeamPicker, LeagueHome, PriceWatch, Stats, etc.

export const TEAM_COLORS = {
  'Red Bull':      '#3671C6',
  'Ferrari':       '#E8002D',
  'McLaren':       '#FF8000',
  'Mercedes':      '#27F4D2',
  'Aston Martin':  '#229971',
  'Alpine':        '#FF87BC',
  'Williams':      '#64C4FF',
  'Racing Bulls':  '#6692FF',
  'Haas':          '#B6BABD',
  'Kick Sauber':   '#52E252',
  'Sauber':        '#52E252',
};

/** Returns the hex color for a constructor name, falling back to neutral gray */
export function teamColor(name) {
  if (!name) return '#52525b';
  const key = Object.keys(TEAM_COLORS).find(
    k => name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? TEAM_COLORS[key] : '#52525b';
}
