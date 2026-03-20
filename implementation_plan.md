# StoryHub: Implementation Plan

This document outlines the step-by-step plan for building StoryHub, prioritizing core functionality and feature progression.

## Phase 1: Setup (2–3 Days)
**Goal:** Establish the foundational infrastructure.
- [ ] Initialize backend project (Node.js/Express or Django).
- [ ] Set up PostgreSQL database and ORM/Query Builder.
- [ ] Set up Google Cloud Project.
- [ ] Enable Google Drive API and Google Docs API.
- [ ] Configure OAuth 2.0 credentials and authorized redirect URIs.

## Phase 2: Authentication (2 Days)
**Goal:** Implement secure user login and token management.
- [ ] Implement Google login flow on the frontend.
- [ ] Handle OAuth callback on the backend.
- [ ] Store user details, `access_token`, and `refresh_token` securely in the database.
- [ ] Verify Drive API access using stored tokens.

## Phase 3: Basic Repository System (3–4 Days)
**Goal:** Allow users to create and view their stories.
- [ ] Build "Create Story" UI component.
- [ ] Backend endpoint to handle repository creation.
- [ ] Implementation of Drive API to create a dedicated folder for each story.
- [ ] Generate the initial Document (`chapter1`) via Docs API.
- [ ] Build Dashboard UI to display the user's repository list.

## Phase 4: Editing Flow (2 Days)
**Goal:** Enable users to write content seamlessly.
- [ ] Implement "Edit" action from the Repository view.
- [ ] Route user directly to Google Docs editor (`docs.google.com/document/d/{doc_id}/edit`).
- [ ] Maintain dynamic `doc_id` mappings in the frontend to load correct document constraints.

## Phase 5: Commit System (4–5 Days)
**Goal:** Introduce snapshot-based version control.
- [ ] Design and implement the "Commit" UI button and message input.
- [ ] Backend logic to trigger Google Drive document duplication (copying `doc_id`).
- [ ] Save new `doc_id` as a discrete commit record in the database.
- [ ] Build Commit History UI to visualize past versions.

## Phase 6: Branching (4 Days)
**Goal:** Support diverging storylines.
- [ ] UI for creating and switching branches.
- [ ] Backend logic to copy the current head document and assign it to a new branch context.
- [ ] Update frontend to dynamically load the valid head `doc_id` based on the selected branch.

## Phase 7: Merge (3–5 Days)
**Goal:** Allow combining standard alternate storylines.
- [ ] Implement simple merge strategy (Source doc completely overwrites Target doc).
- [ ] Backend logic to copy source content to the target branch.
- [ ] Generate a formal merge commit in the target branch history.

## Phase 8: Fork + PR (5–7 Days)
**Goal:** Launch community-driven collaborative features.
- [ ] **Forking:** Build logic to recursively copy Drive files to a new user's Drive.
- [ ] Create cloned repository records linked to the original.
- [ ] **Pull Requests:** Build UI for comparing Source and Target branch metadata.
- [ ] Implement Accept/Reject workflow for the repository owner.

## Phase 9: UI Polish (Ongoing)
**Goal:** Enhance user experience to feel like a premium product.
- [ ] Refine the Dashboard UI.
- [ ] Style the Repository page (similar to GitHub).
- [ ] Polish Commit History view and diff representations (where possible).

---

## Testing Strategy
To ensure system stability, focus on testing the integration points robustly:
1. **API Operations:** Mock and verify Google Drive API behaviors (folder creation, file mapping).
2. **Version Control Integrity:** Validate that commits do not mutate historical doc_ids.
3. **Branching & Merging:** Ensure branch switching loads corresponding files, and merges execute cleanly.
4. **Collaboration:** Simulate multi-user operations, such as forking and pull request authorization.
