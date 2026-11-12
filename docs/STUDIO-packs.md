# AviLearn Studio: theme packs and industry packs

Stage code: `avilearn-app/src/lib/stage/packs/`.
Roadmap: "AviLearn Studio — Strategy and Roadmap", phase A.

A deck sets two packs:

```json
{ "theme": "nav-chart", "vertical": "aviation" }
```

- The **theme pack** is the brand. It sets colours, fonts, heading case and the org, product and portal names.
- The **industry pack** (vertical) sets which domain templates a deck can use and adds voice rules for that industry.
- Core templates work with every pack.

## Packs today

| Pack | Kind | Use |
|---|---|---|
| `nav-chart` | Theme | Aviation Synergy courses. Default |
| `studio-neutral` | Theme | Test theme. Proves that the brand is a setting |
| `aviation` | Industry | Owns `flight-timeline`. Default |
| `general` | Industry | Core templates only |

## Add a theme pack

1. Copy `STUDIO_NEUTRAL` in `packs/themes.ts`. Give it a new `id`.
2. Set `modes.light` and `modes.dark`. Each text colour (`ink`, `inkMuted`, `accent`) must reach 4.5:1 on `bg`. The test checks this.
3. Set `fonts` and one Google Fonts `googleHref`.
4. Set `displayScale` below 1 when the display font is wider than Barlow Condensed. `studio-neutral` uses 0.72.
5. Set `org`, `product`, `portal`, `markIcon`, `headingCase` and `ornament`.
6. Add it to `THEME_PACKS`.
7. Run `npm run test:stage`, `npm run stage:build` and `npm run stage:check`.

## Add an industry pack

1. Add a `VerticalPack` in `packs/verticals.ts`: `id`, `name`, `contentBy`, `templates`, `voice`.
2. A domain template goes in the pack's `templates` list. The compiler rejects it in any other pack.
3. Add voice rules only for words that are wrong in that industry.
4. Add the pack to `VERTICAL_PACKS`.
5. Make one test deck with SAMPLE text only.

## Content rule outside aviation (Anthony, 12 Nov 2026)

- Aviation Synergy writes aviation content only.
- For medical, hospitality and other industries, we build the framework only: packs, templates, checks and a test deck.
- Customer experts write or convert their own content. Set `contentBy: 'customer-expert'`.
- Test decks for these industries use SAMPLE dummy text. They teach nothing.
