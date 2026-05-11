# AviLearn Console — UI Kit

A high-fidelity recreation of the AviLearn Console (admin / instructor) shell. Mirrors the EduAdmin BS5 main-dark template structure: fixed left sidebar, top header, page content with KPI strip + content cards, optional right control drawer.

## Components
- `Sidebar.jsx` — fixed left nav, logo, sectioned nav items with badges.
- `Header.jsx` — top bar with search, breadcrumb, notifications dropdown, user menu.
- `KPIStrip.jsx` — row of KPI cards with 3px top accent + tabular numerics.
- `RosterTable.jsx` — student roster table with avatars, status pills, row menu.
- `ChatApp.jsx` — full chat surface: contacts list, conversation pane, composer.
- `LessonCard.jsx` — course module card with progress bar.
- `Composer.jsx` — message input.
- `Avatar.jsx` — colored gradient circle (initials fallback).

## Run
Open `index.html`. The page demonstrates the Console with three switchable views: **Dashboard**, **Roster**, **Chat**. Click the sidebar items to navigate.
