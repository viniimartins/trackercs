const WEAPON_NAMES: Record<string, string> = {
  ak47: 'AK-47',
  m4a1_silencer: 'M4A1-S',
  m4a1: 'M4A4',
  awp: 'AWP',
  deagle: 'Deagle',
  usp_silencer: 'USP-S',
  glock: 'Glock',
  p250: 'P250',
  fiveseven: 'Five-Seven',
  tec9: 'Tec-9',
  cz75a: 'CZ75',
  elite: 'Dual Berettas',
  hkp2000: 'P2000',
  sg556: 'SG 553',
  aug: 'AUG',
  ssg08: 'Scout',
  g3sg1: 'G3SG1',
  scar20: 'SCAR-20',
  famas: 'FAMAS',
  galilar: 'Galil',
  mp9: 'MP9',
  mac10: 'MAC-10',
  mp7: 'MP7',
  ump45: 'UMP-45',
  p90: 'P90',
  bizon: 'PP-Bizon',
  mp5sd: 'MP5-SD',
  nova: 'Nova',
  xm1014: 'XM1014',
  mag7: 'MAG-7',
  sawedoff: 'Sawed-Off',
  m249: 'M249',
  negev: 'Negev',
  knife: 'Knife',
  knife_t: 'Knife',
  bayonet: 'Knife',
  hegrenade: 'HE Grenade',
  flashbang: 'Flashbang',
  smokegrenade: 'Smoke',
  molotov: 'Molotov',
  incgrenade: 'Incendiary',
  decoy: 'Decoy',
  c4: 'C4',
  taser: 'Zeus',
  revolver: 'R8',
};

// Reverse mapping: display name (from demoparser2) → internal name
const DISPLAY_TO_INTERNAL: Record<string, string> = Object.fromEntries(
  Object.entries(WEAPON_NAMES).map(([internal, display]) => [display, internal]),
);
// Add extra display names from demoparser2 that differ from WEAPON_NAMES values
Object.assign(DISPLAY_TO_INTERNAL, {
  'AK-47': 'ak47',
  'M4A1-S': 'm4a1_silencer',
  'M4A4': 'm4a1',
  'USP-S': 'usp_silencer',
  'Glock-18': 'glock',
  'Desert Eagle': 'deagle',
  'Five-SeveN': 'fiveseven',
  'Tec-9': 'tec9',
  'CZ75-Auto': 'cz75a',
  'Dual Berettas': 'elite',
  'P2000': 'hkp2000',
  'SG 553': 'sg556',
  'SSG 08': 'ssg08',
  'SCAR-20': 'scar20',
  'Galil AR': 'galilar',
  'MAC-10': 'mac10',
  'UMP-45': 'ump45',
  'PP-Bizon': 'bizon',
  'MP5-SD': 'mp5sd',
  'MAG-7': 'mag7',
  'Sawed-Off': 'sawedoff',
  'R8 Revolver': 'revolver',
  'Zeus x27': 'taser',
  'High Explosive Grenade': 'hegrenade',
  'HE Grenade': 'hegrenade',
  'Smoke Grenade': 'smokegrenade',
  'Incendiary Grenade': 'incgrenade',
  'Decoy Grenade': 'decoy',
  'C4 Explosive': 'c4',
  'Butterfly Knife': 'knife',
  'Karambit': 'knife',
  'M9 Bayonet': 'bayonet',
  'Gut Knife': 'knife',
  'Flip Knife': 'knife',
  'Falchion Knife': 'knife',
  'Shadow Daggers': 'knife',
  'Huntsman Knife': 'knife',
  'Bowie Knife': 'knife',
  'Navaja Knife': 'knife',
  'Stiletto Knife': 'knife',
  'Talon Knife': 'knife',
  'Classic Knife': 'knife',
  'Paracord Knife': 'knife',
  'Survival Knife': 'knife',
  'Nomad Knife': 'knife',
  'Skeleton Knife': 'knife',
  'Kukri Knife': 'knife',
});

export type WeaponCategory =
  | 'rifle'
  | 'sniper'
  | 'smg'
  | 'pistol'
  | 'shotgun'
  | 'mg'
  | 'knife'
  | 'grenade'
  | 'equipment'
  | 'unknown';

const WEAPON_CATEGORIES: Record<string, WeaponCategory> = {
  ak47: 'rifle',
  m4a1: 'rifle',
  m4a1_silencer: 'rifle',
  aug: 'rifle',
  sg556: 'rifle',
  famas: 'rifle',
  galilar: 'rifle',
  awp: 'sniper',
  ssg08: 'sniper',
  g3sg1: 'sniper',
  scar20: 'sniper',
  mp9: 'smg',
  mac10: 'smg',
  mp7: 'smg',
  ump45: 'smg',
  p90: 'smg',
  bizon: 'smg',
  mp5sd: 'smg',
  glock: 'pistol',
  usp_silencer: 'pistol',
  hkp2000: 'pistol',
  p250: 'pistol',
  fiveseven: 'pistol',
  tec9: 'pistol',
  deagle: 'pistol',
  cz75a: 'pistol',
  elite: 'pistol',
  revolver: 'pistol',
  nova: 'shotgun',
  xm1014: 'shotgun',
  mag7: 'shotgun',
  sawedoff: 'shotgun',
  m249: 'mg',
  negev: 'mg',
  knife: 'knife',
  knife_t: 'knife',
  bayonet: 'knife',
  taser: 'equipment',
  c4: 'equipment',
  hegrenade: 'grenade',
  flashbang: 'grenade',
  smokegrenade: 'grenade',
  molotov: 'grenade',
  incgrenade: 'grenade',
  decoy: 'grenade',
};

export function normalizeWeapon(weapon?: string): string {
  if (!weapon) return '';
  // Strip weapon_ prefix if present
  const stripped = weapon.replace(/^weapon_/, '');
  // Check if the input is a display name from demoparser2
  if (DISPLAY_TO_INTERNAL[weapon]) return DISPLAY_TO_INTERNAL[weapon];
  if (DISPLAY_TO_INTERNAL[stripped]) return DISPLAY_TO_INTERNAL[stripped];
  return stripped;
}

export function formatWeapon(weapon?: string): string {
  const name = normalizeWeapon(weapon);
  if (!name) return '';
  return WEAPON_NAMES[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

export function getWeaponImagePath(weapon?: string): string {
  const name = normalizeWeapon(weapon);
  if (!name) return '/weapons/knife.png';
  // Normalize knife variants
  if (name.startsWith('knife') || name === 'bayonet') return '/weapons/knife.png';
  return `/weapons/${name}.png`;
}

export function getWeaponCategory(weapon?: string): WeaponCategory {
  const name = normalizeWeapon(weapon);
  if (!name) return 'unknown';
  return WEAPON_CATEGORIES[name] ?? 'unknown';
}
