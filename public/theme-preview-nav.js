document.addEventListener('DOMContentLoaded', () => {
  const nav = document.createElement('nav');
  nav.style.cssText = 'display:flex;gap:16px;padding:12px 20px;background:#222;font-family:sans-serif;font-size:0.85rem;';
  nav.innerHTML = `
    <a href="theme-review.html" style="color:#fff;font-weight:700;">Full review</a>
    <a href="theme-preview.html" style="color:#fff;">Box components</a>
    <a href="theme-preview-assets.html" style="color:#fff;">Asset gallery</a>
    <a href="theme-preview-animations.html" style="color:#fff;">Animation preview</a>
  `;
  document.body.prepend(nav);
});
