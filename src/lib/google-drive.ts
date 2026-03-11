import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/callback"
  );
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function getDriveClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.drive({ version: "v3", auth: oauth2Client });
}

export async function listCSVFiles(
  accessToken: string,
  folderId?: string,
  refreshToken?: string
) {
  const drive = getDriveClient(accessToken, refreshToken);

  let query = "mimeType='text/csv' and trashed=false";
  if (folderId) {
    query = `'${folderId}' in parents and mimeType='text/csv' and trashed=false`;
  }

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name, modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: 100,
  });

  return response.data.files || [];
}

export async function listFolders(accessToken: string, refreshToken?: string) {
  const drive = getDriveClient(accessToken, refreshToken);

  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: "files(id, name)",
    orderBy: "name",
    pageSize: 100,
  });

  return response.data.files || [];
}

export async function getFileContent(
  accessToken: string,
  fileId: string,
  refreshToken?: string
) {
  const drive = getDriveClient(accessToken, refreshToken);

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );

  return response.data as string;
}
