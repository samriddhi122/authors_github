const { google } = require('googleapis');

/**
 * Initializes Google API clients with user-specific OAuth tokens.
 * @param {string} accessToken - User's Google Access Token
 * @param {string} refreshToken - User's Google Refresh Token
 * @returns {object} { drive, docs } Google API instances
 */
const getGoogleApis = (accessToken, refreshToken) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        '/auth/google/callback'
    );

    // Set the user's credentials on the OAuth client
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });

    // Initialize API instances
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    return { drive, docs };
};

/**
 * Creates a new folder in Google Drive.
 * @param {object} drive - Authenticated Drive API instance
 * @param {string} folderName - Name of the folder to create
 * @returns {Promise<string>} Folder ID
 */
const createDriveFolder = async (drive, folderName) => {
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };
    const file = await drive.files.create({
        resource: fileMetadata,
        fields: 'id',
    });
    return file.data.id;
};

/**
 * Creates a new Google Doc inside a specific Drive folder.
 * @param {object} drive - Authenticated Drive API instance
 * @param {string} title - Title of the new document
 * @param {string} parentFolderId - ID of the parent folder
 * @returns {Promise<string>} Document ID
 */
const createDocInFolder = async (drive, title, parentFolderId) => {
    const fileMetadata = {
        name: title,
        mimeType: 'application/vnd.google-apps.document',
        parents: [parentFolderId],
    };
    const file = await drive.files.create({
        resource: fileMetadata,
        fields: 'id',
    });
    return file.data.id;
};

/**
 * Copies a Google Document to create a snapshot (commit).
 * @param {object} drive - Authenticated Drive API instance
 * @param {string} sourceDocId - ID of the doc being copied
 * @param {string} newName - File name for the snapshot
 * @param {string} parentFolderId - ID of the parent folder to store it in
 * @returns {Promise<string>} Document ID of the new copy
 */
const copyDocument = async (drive, sourceDocId, newName, parentFolderId) => {
    const file = await drive.files.copy({
        fileId: sourceDocId,
        requestBody: {
            name: newName,
            parents: [parentFolderId]
        },
        fields: 'id'
    });
    return file.data.id;
};

module.exports = {
    getGoogleApis,
    createDriveFolder,
    createDocInFolder,
    copyDocument
};
