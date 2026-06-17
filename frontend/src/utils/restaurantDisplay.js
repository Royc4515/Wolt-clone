// Category → emoji shown on restaurant placeholder tiles when no image is set.
export const CATEGORY_EMOJI = {
  Pizza: '🍕', Sushi: '🍣', Burgers: '🍔', Asian: '🥡',
  Salads: '🥗', Pasta: '🍝', Desserts: '🍰', Mexican: '🌮',
};

// Deterministic 0–7 bucket from a string, used to pick a placeholder background color.
export function hashIndex(str) {
  return str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 8;
}
