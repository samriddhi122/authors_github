# Implemented Tasks

This document tracks the actual progress of the StoryHub project against the original Implementation Plan. 

## Phase 1: Setup
**Status:** ✅ Completed

- **Backend Initialization:** Node.js/Express server is set up (`server/index.js`).
- **Database:** MongoDB connection is configured via Mongoose (instead of the originally suggested PostgreSQL).
- **Google Cloud:** OAuth credentials set up via `.env`.
- **API Setup:** Scopes requested for `profile`, `email`, and `drive.file`.

## Phase 2: Authentication
**Status:** ✅ Completed

- **Google Login Flow:** Implemented using Passport.js (`server/config/passport.js`).
- **Routes:** Created `/auth/google` and callback endpoints (`server/routes/auth.js`).
- **Token Storage:** Handled during the OAuth Callback process (`server/models/User.js`).
- **Drive API Access:** Functional `server/utils/googleDocs.js` utility created and tested via `/auth/drive-test`.

## Phase 3: Basic Repository System
**Status:** ✅ Completed

- **Database Model:** Created the `Repository` Mongoose model to store repo metadata and Drive Folder IDs.
- **Drive Integrations:** Added `createDriveFolder` and `createDocInFolder` utility functions to `server/utils/googleDocs.js`.
- **API Endpoints:** Created `/repos` route with POST (create repo with Drive structures) and GET (list repos).
- **Frontend UI:** Built the `Dashboard.jsx` component leveraging React state, fetch APIs, and premium glassmorphic CSS to display repositories and a "New Story" modal.

## Phase 4: Editing Flow
**Status:** ✅ Completed

- **Database Tracking:** Added `currentDocId` to the `Repository` model so the system knows what the active head document is.
- **Seamless Editing:** The Dashboard UI renders an **"Edit Story ⇗"** button that routes the user directly to: `docs.google.com/document/d/{currentDocId}/edit` for instant writing access.

## Phase 5: Commit System
**Status:** ✅ Completed

- **Database Model:** Introduced the `Commit` model referencing specific Repositories and capturing message, timestamp, and doc IDs.
- **Drive Versioning:** Programmed `copyDocument` in Google Drive APIs so the backend duplicates the live story document as an immutable, archived snapshot.
- **API Endpoints:** `POST /repos/:id/commits` to generate snapshots, and `GET /repos/:id/commits` to retrieve timeline histories.
- **Frontend Tracking:** Expanded story cards on the Dashboard with two new action UI flows:
  - **Commit:** A dynamic popup allowing users to enter a commit message and trigger the Drive duplication pipeline.
  - **History:** A vertical timeline modal showcasing a reverse-chronological list of every snapshot commit, with direct functional outbound links to uniquely view the preserved historical Google Docs.

## Phase 6: Branching
**Status:** ✅ Completed

- **Database Model:** Introduced the `Branch` schema representing parallel story timelines. Every branch tracks its unique Google Document `currentDocId`.
- **Automatic Initialization:** Re-engineered the `/repos` creation pipeline so that brand new stories are instantly populated with a `main` branch right out of the box.
- **Drive Forking Layer:** Empowered authors to spin up alternate realities. Selecting a snapshot (commit) and executing the Create Branch route will duplicate that historic snapshot in Google Drive into a fresh *Editable* working document, safely isolated from `main`.
- **Checkout / Switch UI:** Expanded the React Dashboard with a robust Branch manager. Users can instantly switch the active default document for their story, meaning the "Edit" button instantly reroutes them to the correct Google Doc equivalent to "checking out" a Git branch.

## Phase 7: UI Polish and Branch Isolation
**Status:** ✅ Completed

- **Vibrant Aesthetic:** Replaced the default dark purple "developer" theme with a clean, vibrant white, slate, and coral light-mode theme heavily optimized for an inspiring writing environment.
- **Card Responsiveness:** Refactored `.card-actions` CSS flex constraints so buttons dynamically wrap without pushing the "Edit" link off the card visually.
- **Branch-Locked Histories:** Inherited standard Git behaviors by tying every single snapshot (`Commit.js`) to the dynamically inferred active `Branch`. When a user checks their History modal, they now only see commits that were sequentially taken on *that specific branch*, enabling fully parallel and untangled storylines.

## Phase 8: Dynamic Workspace Theming
**Status:** ✅ Custom Bonus Feature Completed

- **Theme Engine:** Completely re-engineered `index.css` to rely on global CSS variables driven dynamically by the DOM's `data-theme` attribute.
- **Theme Profiles:** Formulated 4 pristine aesthetic environments designed to inspire different writing moods:
  - 🔆 **Light Mode** (Crisp White and Vibrant Coral)
  - 🌙 **Dark Mode** (Deep Slate and Electric Blue)
  - 📚 **Book Mode** (Warm Sepia/Cream and Terracotta)
  - 🌸 **Floral Mode** (Soft Lilac and Rose Pink)
- **Persistence Layer:** Bound the CSS logic directly to a Dropdown Picker engineered into the Dashboard Navbar. User preferences are hot-swapped instantaneously and physically cached inside the browser's `localStorage` to endure across sessions.

---
*Last updated: Phase 8 Dynamic Theming*
