---
name: avilearn-design
description: Use this skill to generate well-branded interfaces and assets for AviLearn — an aviation training & learning-management platform — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

Key files:
- `README.md` — brand context, content fundamentals, visual foundations, iconography.
- `colors_and_type.css` — design tokens (CSS custom properties) and base element styles.
- `assets/avilearn-logo.svg`, `assets/avilearn-logo-light.svg`, `assets/avilearn-mark.svg` — brand marks.
- `preview/*.html` — small reference cards for every token / component cluster.
- `ui_kits/console/` — high-fidelity recreation of the AviLearn Console (admin) UI. Components + interactive index.html.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Defaults to remember without re-reading: dark canvas `#14171f`, brand teal `#2dd4bf`, Inter + JetBrains Mono, 6px card radius, 1px hairline borders **and no shadow on cards**, sentence case everywhere, no emoji, Lucide icons at 1.5px stroke.
