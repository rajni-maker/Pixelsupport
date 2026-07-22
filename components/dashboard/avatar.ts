// Avatar helpers shared by the dark screens.

// "Rajni Garg" -> "RG"; falls back to the first two characters of a single
// word (or an email local-part) so an avatar is never blank.
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] ?? "?").slice(0, 2).toUpperCase();
}

// The mockups give each person a different avatar gradient. Pick one from a
// stable hash of their id so the same person keeps the same colour on every
// render and every page — never random.
const GRADIENTS = [
  "bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4]",
  "bg-gradient-to-br from-[#f97316] to-[#f59e0b]",
  "bg-gradient-to-br from-[#22c55e] to-[#06b6d4]",
  "bg-gradient-to-br from-[#ec4899] to-[#8b5cf6]",
  "bg-gradient-to-br from-[#6366f1] to-[#06b6d4]",
  "bg-gradient-to-br from-[#eab308] to-[#f97316]",
];

export function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}
