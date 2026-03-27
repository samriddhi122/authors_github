# StoryHub: Project Documentation

## 1. Overview
StoryHub is a collaborative storytelling platform inspired by Git workflows.
Writers create stories as repositories, where each story evolves via commits, branches, and merges. 
Content is stored in users' own Google Drive using the Google Drive API and Google Docs API.
The system acts as a version control layer specifically tailored for writing.

## 2. Objectives
- **Enable collaborative storytelling:** Provide Git-like version control for text content.
- **Cost-Effective Storage:** Avoid central storage costs by leveraging user-owned Google Drive storage.
- **Open-Source Style Contributions:** Support forks and Pull Requests (PRs) for community-driven stories.

## 3. System Architecture
### High-Level Components
1. **Frontend**
   - **Tech Stack:** React / Next.js
   - **Responsibilities:** Handles UI for the Dashboard, Repository View, Branching, and Commit UI.
2. **Backend**
   - **Tech Stack:** Node.js (Express) or Django
   - **Responsibilities:** Handles Authentication, Repository Logic, Commit/Branch Logic, and API Integrations.
3. **Database**
   - **Tech Stack:** MongoDB (Mongoose)
   - **Responsibilities:** Stores details for Users, Repositories, Branches, Commits, and Google Doc references.
4. **External Services**
   - **Google OAuth 2.0:** Handles user login and identity.
   - **Google Drive API:** Manages file storage and directory structures.
   - **Google Docs API:** Facilitates content access and formatting.

## 4. Authentication Flow
1. User initiates login via "Login with Google".
2. Google OAuth consent screen is displayed.
3. System receives `Access Token` and `Refresh Token`.
4. Tokens are stored securely in the database.

**Required Scopes:**
- `drive.file`
- `userinfo.profile`
- `openid`

## 5. Core Data Model
### User
- `id`
- `name`
- `email`
- `google_id`
- `access_token`
- `refresh_token`

### Repository (Story)
- `id`
- `name`
- `description`
- `owner_id`
- `visibility` (public/private)
- `created_at`

### Branch
- `id`
- `repo_id`
- `name`
- `head_commit_id`
- `created_from_commit_id`

### Commit
- `id`
- `repo_id`
- `branch_id`
- `doc_id` (Google Doc ID)
- `parent_commit_id`
- `commit_message`
- `created_at`

### Fork
- `id`
- `original_repo_id`
- `new_repo_id`
- `user_id`

## 6. Core Features & Logic
### A. Create Repository
- **Flow:** User clicks "New Story".
- **Backend:** Creates a new folder in Google Drive, creates the initial Google Doc (e.g., `chapter1`), and saves the `doc_id` in the database.

### B. Commit System
- **Trigger:** User clicks "Commit".
- **Steps:** Get the current `doc_id`, call the Drive API to copy the document, and save the new `doc_id` as a new commit snapshot.

### C. Branching
- **Steps:** Select the base commit, copy its document, and create a new branch pointing to this new commit.

### D. Editing
- **Flow:** User clicks "Edit", and the system redirects them to `docs.google.com/document/d/{doc_id}/edit`.

### E. Merge (MVP)
- **Simple Strategy:** Source document overwrites the target document.
- **Steps:** Copy the source document and create a new commit in the target branch.

### F. Fork
- **Steps:** Copy all relevant documents to the new user's Google Drive, create a new repository entry in the database, and maintain a link to the original repository.

### G. Pull Requests
- **Flow:** User selects the Source branch and Target branch to show commit differences. The repository owner can then accept (merge) or reject the PR.

## 7. Key Design Constraints
- No real Git engine; the system simulates version control using document copies.
- No real-time edit tracking; commits are manual snapshots.
- Merge conflicts will be handled using a simple overwrite strategy for the MVP.

## 8. Future Enhancements
- Diff viewer (text comparison)
- Inline comments
- AI writing assistant
- Real-time collaboration layer
- Markdown support

## Final Insight
The system functions as a hybrid of GitHub, Medium, and Google Docs. 
Mechanically:
- **Google Docs** = Content Layer
- **Backend** = Version Control Engine
- **Frontend** = Collaboration UI
