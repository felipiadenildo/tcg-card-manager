// Loaded in <head>, before the stylesheet paints, so the saved palette is
// applied on first render instead of flashing the default one.
const PALETTE_KEY = 'tcg-palette';
const PALETTES = ['dmg', 'pocket', 'berry', 'grape'];

function readSavedPalette() {
  // Storage can throw in private windows or with site data blocked, and the
  // page should still work with the default palette when that happens.
  try {
    const saved = localStorage.getItem(PALETTE_KEY);
    return PALETTES.includes(saved) ? saved : 'dmg';
  } catch {
    return 'dmg';
  }
}

function applyPalette(name) {
  document.documentElement.dataset.palette = name;
  document.querySelectorAll('[data-palette-option]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.paletteOption === name));
  });
  try {
    localStorage.setItem(PALETTE_KEY, name);
  } catch {
    // Not saved, but the palette still changes for this page view.
  }
}

document.documentElement.dataset.palette = readSavedPalette();

document.addEventListener('DOMContentLoaded', () => {
  applyPalette(readSavedPalette());
  document.querySelectorAll('[data-palette-option]').forEach((button) => {
    button.addEventListener('click', () => applyPalette(button.dataset.paletteOption));
  });
});
