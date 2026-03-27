# StoryHub API Documentation

This document outlines the available REST API endpoints exposed by the StoryHub backend for frontend consumption.

## Base URL
All API requests evaluate against `/` (e.g. `http://localhost:5000`).

---

## Authentication APIs

All authentication is handled via session cookies managed by Google OAuth and Passport.js. The frontend needs to include `credentials: 'include'` in all fetch/axios requests.

### 1. Initiate Google Login
- **Endpoint:** `GET /auth/google`
- **Description:** Redirects the user to the Google OAuth consent screen.
- **Frontend Usage:** Must be used as a direct standard link (`<a href="http://localhost:5000/auth/google">Login</a>`) rather than an AJAX fetch, because of CORS and browser redirect rules.

### 2. Check Current User
- **Endpoint:** `GET /auth/user`
- **Description:** Returns the logged-in user's profile data if a valid session exists.
- **Response (200 OK):**
```json
{
  "_id": "60d5ec49f1b2c8...",
  "googleId": "1049283748237...",
  "displayName": "John Doe",
  "email": "john.doe@gmail.com",
  "image": "https://lh3.googleusercontent.com/a/..."
}
```
- **Response (Empty):** If not logged in, it typically returns empty or `null`.

### 3. Logout
- **Endpoint:** `GET /auth/logout`
- **Description:** Destroys the user session and redirects to the frontend homepage.
- **Frontend Usage:** Standard link (`<a href="http://localhost:5000/auth/logout">Logout</a>`).

### 4. Test Google Drive Access (Diagnostics)
- **Endpoint:** `GET /auth/drive-test`
- **Description:** Verifies that the Google Drive API tokens are working by fetching the top 5 files from the user's Drive.
- **Response (200 OK):**
```json
{
  "success": true,
  "files": [
    { "id": "1abc...", "name": "Resume.pdf" }
  ]
}
```

---

## Repository APIs

**Authentication Required:** All `/repos` endpoints require the user to be logged in (requires session cookie).

### 1. Create a Repository (Story)
- **Endpoint:** `POST /repos`
- **Description:** Creates a new story. Automatically creates a dedicated Google Drive folder and an initial "chapter1" document inside it.
- **Request Body:**
```json
{
  "name": "My Epic Fantasy",
  "description": "A tale of swords and magic",
  "visibility": "public" // optional, defaults to 'public'. Can be 'private'.
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "repository": {
    "_id": "60d5ef0b...",
    "name": "My Epic Fantasy",
    "description": "A tale of swords and magic",
    "visibility": "public",
    "ownerId": "60d5ec49...",
    "driveFolderId": "1XYZabc...",
    "createdAt": "2023-10-25T10:00:00.000Z"
  },
  "initialDocId": "1PQRdef..."
}
```

### 2. Get User's Repositories
- **Endpoint:** `GET /repos`
- **Description:** Fetches all stories/repositories owned by the currently authenticated user, sorted by newest first.
- **Response (200 OK):**
```json
{
  "success": true,
  "repositories": [
    {
      "_id": "60d5ef0b...",
      "name": "My Epic Fantasy",
      "description": "A tale of swords and magic",
      "visibility": "public",
      "ownerId": "60d5ec49...",
      "driveFolderId": "1XYZabc...",
      "createdAt": "2023-10-25T10:00:00.000Z"
    }
  ]
}
```
- **Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```
