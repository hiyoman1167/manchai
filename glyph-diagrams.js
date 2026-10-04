/* Shared, local stroke drawings. Unknown code variants use plain text. */
window.MANCHAI_GLYPH = {
  info(character, full) {
    const drawing = window.MANCHAI_DIAGRAMS?.glyphs[character];
    return drawing?.[0] === full ? drawing : null;
  },
  markup(character, full) {
    if (!this.info(character, full)) return character;
    const path = `assets/glyphs/${character.codePointAt(0).toString(16)}.svg`;
    return `<svg class="diagram-strokes" viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
      <use href="${path}#ink" class="glyph-ink"/>
      <use href="${path}#first" class="glyph-first"/>
      <use href="${path}#last" class="glyph-last"/>
    </svg>`;
  }
};
