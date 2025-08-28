

import { WebContainer } from '@webcontainer/api';
import type { FileSystemNode, WebContainerStatus } from '../types';
import JSZip from 'jszip';

const CONTAINERS_API_DOCS = `
# OpenAI Containers API Documentation

This document outlines the API for creating and managing containers for use with the Code Interpreter tool.

---

## Containers

### Create Container

\`POST https://api.openai.com/v1/containers\`

Creates a new container.

#### Request Body

-   **\`name\`** (string, Required)
    Name of the container to create.
-   **\`expires_after\`** (object, Optional)
    Container expiration time in seconds relative to the 'anchor' time.
-   **\`file_ids\`** (array, Optional)
    IDs of files to copy to the container.

#### Returns

The created \`container\` object.

#### Example Request

\`\`\`sh
curl https://api.openai.com/v1/containers \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
        "name": "My Container"
      }'
\`\`\`

---

### List Containers

\`GET https://api.openai.com/v1/containers\`

Lists all available containers.

#### Query Parameters

-   **\`after\`** (string, Optional)
    A cursor for use in pagination.
-   **\`limit\`** (integer, Optional, default: 20)
    A limit on the number of objects to be returned (1-100).
-   **\`order\`** (string, Optional, default: 'desc')
    Sort order by \`created_at\` timestamp ('asc' or 'desc').

#### Returns

A list of \`container\` objects.

#### Example Request

\`\`\`sh
curl https://api.openai.com/v1/containers \\
  -H "Authorization: Bearer $OPENAI_API_KEY"
\`\`\`

---

### Retrieve Container

\`GET https://api.openai.com/v1/containers/{container_id}\`

Retrieves a specific container.

#### Path Parameters

-   **\`container_id\`** (string, Required)
    The ID of the container to retrieve.

#### Returns

The \`container\` object.

#### Example Request

\`\`\`sh
curl https://api.openai.com/v1/containers/cntr_... \\
  -H "Authorization: Bearer $OPENAI_API_KEY"
\`\`\`

---

### Delete a Container

\`DELETE https://api.openai.com/v1/containers/{container_id}\`

Deletes a container.

#### Path Parameters

-   **\`container_id\`** (string, Required)
    The ID of the container to delete.

#### Returns

A deletion status object.

#### Example Request

\`\`\`sh
curl -X DELETE https://api.openai.com/v1/containers/cntr_... \\
  -H "Authorization: Bearer $OPENAI_API_KEY"
\`\`\`

---

## Container Files

### Create Container File

\`POST https://api.openai.com/v1/containers/{container_id}/files\`

Creates a file within a container. You can send either a \`multipart/form-data\` request with the raw file content, or a JSON request with a file ID.

#### Path Parameters

-   **\`container_id\`** (string, Required)

#### Request Body

-   **\`file\`** (file, Optional)
    The File object (not file name) to be uploaded.
-   **\`file_id\`** (string, Optional)
    ID of an existing file to copy into the container.

#### Returns

The created \`container.file\` object.

#### Example Request

\`\`\`sh
curl https://api.openai.com/v1/containers/cntr_.../files \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -F file="@example.txt"
\`\`\`

---

### List Container Files

\`GET https://api.openai.com/v1/containers/{container_id}/files\`

Lists all files within a specific container.

#### Path Parameters

-   **\`container_id\`** (string, Required)

#### Query Parameters

-   **\`after\`**, **\`limit\`**, **\`order\`** (same as List Containers)

#### Returns

A list of \`container.file\` objects.

---

### Retrieve Container File

\`GET https://api.openai.com/v1/containers/{container_id}/files/{file_id}\`

Retrieves a specific file object from a container.

#### Path Parameters

-   **\`container_id\`** (string, Required)
-   **\`file_id\`** (string, Required)

#### Returns

The \`container.file\` object.

---

### Retrieve Container File Content

\`GET https://api.openai.com/v1/containers/{container_id}/files/{file_id}/content\`

Retrieves the binary content of a container file.

#### Path Parameters

-   **\`container_id\`** (string, Required)
-   **\`file_id\`** (string, Required)

#### Returns

The binary content of the file.

---

### Delete a Container File

\`DELETE https://api.openai.com/v1/containers/{container_id}/files/{file_id}\`

Deletes a file from a container.

#### Path Parameters

-   **\`container_id\`** (string, Required)
-   **\`file_id\`** (string, Required)

#### Returns

A deletion status object.
`;


// In-memory mock file system node types
interface MockFile {
  type: 'file';
  content: string;
}
interface MockDir {
  type: 'directory';
  children: { [name: string]: MockFile | MockDir };
}
type MockNode = MockFile | MockDir;

class WebContainerService {
  private static instance: WebContainerService;
  private webcontainerInstance: WebContainer | null = null;
  private isMock = false;
  private mockRoot: MockDir = { type: 'directory', children: {} };

  private constructor() {}

  public static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService();
    }
    return WebContainerService.instance;
  }
  
  private async _configureGit(): Promise<void> {
    if (this.isMock) return;
    const wc = await this.ensureReady();
    try {
      await wc.spawn('git', ['config', '--global', 'user.name', 'CASSA VEGAS']);
      await wc.spawn('git', ['config', '--global', 'user.email', 'contact@cassavegas.com']);
    } catch (e) {
        console.error("Failed to configure git:", e);
    }
  }

  public async boot(statusCallback: (status: WebContainerStatus, isMock: boolean) => void): Promise<void> {
    if (this.webcontainerInstance) {
      statusCallback('READY', false);
      return;
    }
    if (this.isMock) {
        statusCallback('READY', true);
        return;
    }
    
    statusCallback('BOOTING', false);

    const useMock = typeof SharedArrayBuffer === 'undefined';

    if (useMock) {
        console.warn("SharedArrayBuffer not available. Falling back to mock file system.");
        this.isMock = true;
        this.initializeMockFs();
        statusCallback('READY', true);
        return;
    }

    try {
      this.webcontainerInstance = await WebContainer.boot();
      await this._configureGit();
      await this.writeFile('/README.md', '# CASSA VEGAS Command Console\nWelcome to the file system.');
      await this.makeDir('/docs/guides');
      await this.writeFile('/docs/getting-started.md', '## Getting Started\nUse the commands to navigate and manage files.');
      await this.writeFile('/docs/guides/advanced-usage.md', '## Advanced Usage\nExplore agent orchestration.');
      await this.writeFile('/docs/openai-containers-api.md', CONTAINERS_API_DOCS);
      this.isMock = false;
      statusCallback('READY', false);
    } catch (error) {
      console.error('WebContainer boot failed, falling back to mock file system:', error);
      this.isMock = true;
      this.initializeMockFs();
      statusCallback('READY', true);
    }
  }

  // --- Mock FS Implementation ---

  private initializeMockFs(): void {
    this.mockRoot = { type: 'directory', children: {} };
    this.mockMakeDir('/docs/guides');
    this.mockWriteFile('/README.md', '# CASSA VEGAS Command Console\nWelcome to the file system (mock mode).');
    this.mockWriteFile('/docs/getting-started.md', '## Getting Started\nUse the commands to navigate and manage files.');
    this.mockWriteFile('/docs/guides/advanced-usage.md', '## Advanced Usage\nExplore agent orchestration.');
    this.mockWriteFile('/docs/openai-containers-api.md', CONTAINERS_API_DOCS);
  }
  
  private findNode(path: string, createMissingDirs = false): { parent: MockDir | null; name: string; node: MockNode | undefined } {
    const parts = path.split('/').filter(p => p);
    if (parts.length === 0) return { parent: null, name: '/', node: this.mockRoot };

    let current: MockDir = this.mockRoot;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        let nextNode = current.children[part];
        if (!nextNode) {
            if (createMissingDirs) {
                nextNode = current.children[part] = { type: 'directory', children: {} };
            } else {
                throw new Error(`Path does not exist: Parent directory '${part}' not found.`);
            }
        }
        if (nextNode.type !== 'directory') {
            throw new Error(`Path is invalid: '${part}' is a file, not a directory.`);
        }
        current = nextNode as MockDir;
    }
    const name = parts[parts.length - 1];
    return { parent: current, name, node: current.children[name] };
  }

  private mockListFiles(path: string): string[] {
    const { node } = this.findNode(path);
    if (!node || node.type !== 'directory') {
      throw new Error(`Directory not found: ${path}`);
    }
    return Object.keys(node.children).map(name => 
      node.children[name].type === 'directory' ? `${name}/` : name
    );
  }

  private mockReadFile(path: string): string {
    const { node } = this.findNode(path);
    if (!node) throw new Error(`File not found: ${path}`);
    if (node.type !== 'file') throw new Error(`Not a file: ${path}`);
    return node.content;
  }

  private mockWriteFile(path: string, content: string): void {
    const { parent, name } = this.findNode(path, true);
    if (!parent) throw new Error("Cannot write to root.");
    parent.children[name] = { type: 'file', content };
  }

  private mockMakeDir(path: string): void {
    const { parent, name, node } = this.findNode(path, true);
    if (node) {
        if (node.type === 'directory') return; // already exists
        throw new Error(`Cannot create directory, a file with the same name exists: ${path}`);
    }
    if (!parent) throw new Error("Cannot create directory at root.");
    parent.children[name] = { type: 'directory', children: {} };
  }

  private mockRemoveItem(path: string): void {
      const { parent, name, node } = this.findNode(path);
      if (!node) throw new Error(`Item not found: ${path}`);
      if (!parent) throw new Error("Cannot remove root directory.");
      delete parent.children[name];
  }

  private mockGetFileSystemTree(dirNode: MockDir, currentPath: string): FileSystemNode[] {
    const tree: FileSystemNode[] = [];
    for (const name in dirNode.children) {
      const node = dirNode.children[name];
      const fullPath = `${currentPath === '/' ? '' : currentPath}/${name}`;
      if (node.type === 'directory') {
        tree.push({
          name,
          path: fullPath,
          type: 'directory',
          children: this.mockGetFileSystemTree(node, fullPath),
        });
      } else {
        tree.push({ name, path: fullPath, type: 'file' });
      }
    }
    return tree.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
    });
  }

  // --- Public API ---

  private async ensureReady(): Promise<WebContainer> {
    if (this.isMock) throw new Error("Operation not available in mock mode.");
    if (!this.webcontainerInstance) throw new Error("WebContainer is not booted.");
    return this.webcontainerInstance;
  }

  public async listFiles(path: string): Promise<string[]> {
    if (this.isMock) return this.mockListFiles(path);
    const wc = await this.ensureReady();
    const entries = await wc.fs.readdir(path, { withFileTypes: true });
    return entries.map(entry => (entry.isDirectory() ? `${entry.name}/` : entry.name));
  }

  public async readFile(path: string): Promise<string> {
    if (this.isMock) return this.mockReadFile(path);
    const wc = await this.ensureReady();
    return await wc.fs.readFile(path, 'utf-8');
  }

  public async writeFile(path: string, content: string): Promise<void> {
    if (this.isMock) return this.mockWriteFile(path, content);
    const wc = await this.ensureReady();
    await wc.fs.writeFile(path, content);
  }

  public async makeDir(path: string): Promise<void> {
    if (this.isMock) return this.mockMakeDir(path);
    const wc = await this.ensureReady();
    await wc.fs.mkdir(path, { recursive: true });
  }

  public async removeItem(path: string): Promise<void> {
    if (this.isMock) return this.mockRemoveItem(path);
    const wc = await this.ensureReady();
    await wc.fs.rm(path, { recursive: true, force: true });
  }
  
  public async getFileSystemTree(path: string = '/'): Promise<FileSystemNode[]> {
    if (this.isMock) return this.mockGetFileSystemTree(this.mockRoot, '/');

    // Recursive helper for real WebContainer FS
    const buildTree = async (currentPath: string): Promise<FileSystemNode[]> => {
      const wc = await this.ensureReady();
      const entries = await wc.fs.readdir(currentPath, { withFileTypes: true });
      const tree: FileSystemNode[] = [];
      for (const entry of entries) {
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${entry.name}`;
        if (entry.isDirectory()) {
          tree.push({
            name: entry.name,
            path: fullPath,
            type: 'directory',
            children: await buildTree(fullPath),
          });
        } else {
          tree.push({ name: entry.name, path: fullPath, type: 'file' });
        }
      }
      return tree.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
    }
    return buildTree(path);
  }

  public async zipDirectory(path: string): Promise<string> {
    if (this.isMock) throw new Error("Zipping is not supported in mock file system mode.");
    const wc = await this.ensureReady();
    const zip = new JSZip();

    const addFilesRecursively = async (currentPath: string, zipFolder: JSZip) => {
        const entries = await wc.fs.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = `${currentPath}/${entry.name}`;
            if (entry.isDirectory()) {
                const newFolder = zipFolder.folder(entry.name);
                if(newFolder) await addFilesRecursively(fullPath, newFolder);
            } else {
                const content = await wc.fs.readFile(fullPath);
                zipFolder.file(entry.name, content);
            }
        }
    };

    const dirName = path.split('/').pop() || 'archive';
    const rootZipFolder = zip.folder(dirName);
    if(rootZipFolder) await addFilesRecursively(path, rootZipFolder);

    const zipContent = await zip.generateAsync({ type: 'uint8array' });

    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const zipFileName = `${dirName}.zip`;
    const finalZipPath = parentPath === '/' ? `/${zipFileName}` : `${parentPath}/${zipFileName}`;
    
    await wc.fs.writeFile(finalZipPath, zipContent);
    return finalZipPath;
  }

  public async unzipFile(path: string): Promise<void> {
    if (this.isMock) throw new Error("Unzipping is not supported in mock file system mode.");
    const wc = await this.ensureReady();
    const zipData = await wc.fs.readFile(path);
    const zip = await JSZip.loadAsync(zipData);
    const targetDir = path.substring(0, path.lastIndexOf('/')) || '/';
    
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      const fullPath = `${targetDir}/${relativePath}`;
      if ((zipEntry as any).dir) {
        await wc.fs.mkdir(fullPath, { recursive: true });
      } else {
        const content = await (zipEntry as any).async('uint8array');
        const parent = fullPath.substring(0, fullPath.lastIndexOf('/'));
        if(parent) {
            await wc.fs.mkdir(parent, { recursive: true });
        }
        await wc.fs.writeFile(fullPath, content);
      }
    }
  }

  public async runCommand(command: string, args: string[]): Promise<string> {
    if (this.isMock) {
        return `Error: Command execution is disabled in mock file system mode.`;
    }
    const wc = await this.ensureReady();
    const process = await wc.spawn(command, args);
    let output = '';
    process.output.pipeTo(new WritableStream({
        write(data) { output += data; }
    }));
    const exitCode = await process.exit;
    if (exitCode !== 0) {
        return `Command failed with exit code ${exitCode}:\n${output}`;
    }
    return output;
  }
}

export const webcontainerService = WebContainerService.getInstance();