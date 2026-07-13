export interface Passage {
  name: string;
  text: string;
}

/** Newlines are collapsed to spaces so the text reflows as one continuous stream. */
const clean = (s: string): string => s.trim().replace(/\s+/g, " ");

export const passages: Passage[] = [
  {
    name: "prose",
    text: clean(`
      The sun had not yet risen. The sea was indistinguishable from the sky,
      except that the sea was slightly creased as if a cloth had wrinkles in it.
      Gradually as the sky whitened a dark line lay on the horizon dividing the
      sea from the sky and the grey cloth became barred with thick strokes moving,
      one after another, beneath the surface, following each other, pursuing each
      other, perpetually. As they neared the shore each bar rose, heaped itself,
      broke and swept a thin veil of white water across the sand.
    `),
  },
  {
    name: "plain",
    text: clean(`
      The quick brown fox jumps over the lazy dog. Pack my box with five dozen
      liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards
      jump quickly. Sphinx of black quartz, judge my vow. Two driven jocks help
      fax my big quiz. Five quacking zephyrs jolt my wax bed. The jay, pig, fox,
      zebra and my wolves quack. Blowzy red vixens fight for a quick jump.
    `),
  },
  {
    name: "code",
    text: clean(`
      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      if (total > 100 && !user.isMember) { applyDiscount(total, 0.1); }
      export function parse(input: string): Result<Config, Error> {
        try { return { ok: true, value: JSON.parse(input) }; }
        catch (e) { return { ok: false, error: e as Error }; }
      }
      for (let i = 0; i < xs.length; i++) { console.log(\`\${i}: \${xs[i]}\`); }
    `),
  },
];
