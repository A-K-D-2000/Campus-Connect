export const THEMES = [
  { id: 'meadow', name: 'Meadow', desc: 'Light and leafy' },
  { id: 'lagoon', name: 'Lagoon', desc: 'Cool and breezy' },
  { id: 'blossom', name: 'Blossom', desc: 'Soft rose and peach' },
  { id: 'marigold', name: 'Marigold', desc: 'Warm and sunny' },
  { id: 'forest', name: 'Forest', desc: 'Dark and calm' },
  { id: 'dusk', name: 'Dusk', desc: 'Dark indigo and gold' },
];

const KEY = 'theme';

// The theme saved in this browser, or the default
export const getTheme = () => {
  try {
    const saved = localStorage.getItem(KEY);
    return THEMES.some((t) => t.id === saved) ? saved : 'meadow';
  } catch {
    return 'meadow';
  }
};

// Switch the whole app to a theme now, and remember it
export const applyTheme = (id) => {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // Private browsing can block storage; the theme still applies for this visit
  }
};