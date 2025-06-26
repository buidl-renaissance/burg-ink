import { OAuth2Client } from 'google-auth-library';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime: string;
  modifiedTime: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
}

export class GoogleDriveService {
  private oauth2Client: OAuth2Client;

  constructor(accessToken: string) {
    this.oauth2Client = new OAuth2Client();
    this.oauth2Client.setCredentials({ access_token: accessToken });
  }

  async listFolders(): Promise<DriveFolder[]> {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.folder"&fields=files(id,name,createdTime,modifiedTime)',
      {
        headers: {
          'Authorization': `Bearer ${this.oauth2Client.credentials.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }

    const data = await response.json();
    return data.files.map((folder: { id: string; name: string }) => ({
      id: folder.id,
      name: folder.name,
      files: [],
    }));
  }

  async listFilesInFolder(folderId: string): Promise<DriveFile[]> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q="${folderId}" in parents and (mimeType contains "image/" or mimeType contains "video/")&fields=files(id,name,mimeType,size,webContentLink,thumbnailLink,createdTime,modifiedTime)`,
      {
        headers: {
          'Authorization': `Bearer ${this.oauth2Client.credentials.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    const data = await response.json();
    return data.files;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${this.oauth2Client.credentials.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch file content');
    }

    return response.arrayBuffer();
  }
} 