# StoryHub: Implementation Plan

This document outlines the step-by-step plan for building StoryHub, prioritizing core functionality and feature progression.

## Phase 1: Setup (2–3 Days)
**Goal:** Establish the foundational infrastructure.
- [x] Initialize backend project (Node.js/Express).
- [x] Set up MongoDB database and Mongoose ORM.
- [x] Set up Google Cloud Project.
- [x] Enable Google Drive API and Google Docs API.
- [x] Configure OAuth 2.0 credentials and authorized redirect URIs.

## Phase 2: Authentication (2 Days)
**Goal:** Implement secure user login and token management.
- [x] Implement Google login flow on the frontend (Session/Passport).
- [x] Handle OAuth callback on the backend.
- [x] Store user details, `access_token`, and `refresh_token` securely in the database.
- [x] Verify Drive API access using stored tokens (added `/auth/drive-test`).

## Phase 3: Basic Repository System (3–4 Days)
**Goal:** Allow users to create and view their stories.
- [x] Build "Create Story" UI component.
- [x] Backend endpoint to handle repository creation.
- [x] Implementation of Drive API to create a dedicated folder for each story.
- [x] Generate the initial Document (`chapter1`) via Docs API.
- [x] Build Dashboard UI to display the user's repository list.

## Phase 4: Editing Flow (2 Days)
**Goal:** Enable users to write content seamlessly.
- [x] Implement "Edit" action from the Repository view.
- [x] Route user directly to Google Docs editor (`docs.google.com/document/d/{doc_id}/edit`).
- [x] Maintain dynamic `doc_id` mappings in the frontend to load correct document constraints.

## Phase 5: Commit System (4–5 Days)
**Goal:** Introduce snapshot-based version control.
- [x] Design and implement the "Commit" UI button and message input.
- [x] Backend logic to trigger Google Drive document duplication (copying `doc_id`).
- [x] Save new `doc_id` as a discrete commit record in the database.
- [x] Build Commit History UI to visualize past versions.

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
- [x] **Forking:** Build logic to recursively copy Drive files to a new user's Drive.
- [x] Create cloned repository records linked to the original.
- [x] **Pull Requests:** Build UI for comparing Source and Target branch metadata.
- [x] Implement Accept/Reject workflow for the repository owner.

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
