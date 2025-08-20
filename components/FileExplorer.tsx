
import React, { useState, useEffect, useCallback, useRef } from 'react';
import FileTree from './FileTree';
import { FileSystemNode, WebContainerStatus, VectorIndexStatus, Agent } from '../types';
import { webcontainerService } from '../services/webcontainerService';
import { performSemanticSearch } from '../services/geminiService';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

interface FileExplorerProps {
    webContainerStatus: WebContainerStatus;
    agent: Agent;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ webContainerStatus, agent }) => {
    const [tree, setTree] = useState<FileSystemNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<FileSystemNode | null>(null);
    const [editableContent, setEditableContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [indexStatus, setIndexStatus] = useState<Map<string, VectorIndexStatus>>(new Map());
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<string | null>(null);

    const initializeIndexStatus = useCallback((nodes: FileSystemNode[]) => {
        setIndexStatus(prevStatus => {
            const newStatus = new Map<string, VectorIndexStatus>();
            let hasChanged = false;

            const traverse = (nodeList: FileSystemNode[]) => {
                for (const node of nodeList) {
                    if (node.type === 'file') {
                        const oldStatus = prevStatus.get(node.path);
                        const newFileStatus = oldStatus || 'NOT_INDEXED';
                        newStatus.set(node.path, newFileStatus);
                        if (oldStatus !== newFileStatus) {
                            hasChanged = true;
                        }
                    }
                    if (node.children) {
                        traverse(node.children);
                    }
                }
            };
            traverse(nodes);

            if (prevStatus.size !== newStatus.size) {
                hasChanged = true;
            }

            return hasChanged ? newStatus : prevStatus;
        });
    }, []);

    const loadTree = useCallback(async () => {
        setActionError(null);
        try {
            const fileSystemTree = await webcontainerService.getFileSystemTree();
            setTree(fileSystemTree);
            initializeIndexStatus(fileSystemTree);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load file system tree.');
        } finally {
            setIsLoading(false);
        }
    }, [initializeIndexStatus]);

    useEffect(() => {
        if (webContainerStatus === 'READY') {
            setIsLoading(true);
            loadTree();
        } else if (webContainerStatus !== 'BOOTING') {
            setIsLoading(false);
            setError(`File system is not available. Status: ${webContainerStatus}`);
        }
    }, [webContainerStatus, loadTree]);

    useEffect(() => {
        const loadFileContent = async () => {
            if (selectedNode && selectedNode.type === 'file') {
                try {
                    const content = await webcontainerService.readFile(selectedNode.path);
                    setEditableContent(content);
                } catch (e) {
                    setEditableContent(`Error reading file: ${e instanceof Error ? e.message : 'Unknown error'}`);
                }
            } else {
                setEditableContent('');
            }
        };
        loadFileContent();
    }, [selectedNode]);
    
    const handleNodeSelect = (node: FileSystemNode) => {
        setSelectedNode(node);
        setSearchResults(null);
        setSearchQuery('');
        setActionError(null);
    };
    
    const handleIndexFile = async () => {
        if (selectedNode?.type !== 'file') return;
        const path = selectedNode.path;
        setIndexStatus(prev => new Map(prev).set(path, 'INDEXING'));
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIndexStatus(prev => new Map(prev).set(path, 'INDEXED'));
        } catch (e) {
            setIndexStatus(prev => new Map(prev).set(path, 'ERROR'));
            console.error("Indexing simulation failed", e);
        }
    };
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || isSearching) return;
        
        setIsSearching(true);
        setSearchResults(null);
        setSelectedNode(null);
        
        try {
            const indexedFilesToSearch: { path: string, content: string }[] = [];
            for (const [path, status] of indexStatus.entries()) {
                if (status === 'INDEXED') {
                    const content = await webcontainerService.readFile(path);
                    indexedFilesToSearch.push({ path, content });
                }
            }
            const results = await performSemanticSearch(searchQuery, indexedFilesToSearch, agent.personality_prompt);
            setSearchResults(results);
        } catch (e) {
            setSearchResults(`Search failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSaveContent = async () => {
        if (selectedNode?.type !== 'file' || isSaving) return;
        setIsSaving(true);
        setActionError(null);
        try {
            await webcontainerService.writeFile(selectedNode.path, editableContent);
        } catch (e) {
            setActionError(e instanceof Error ? e.message : 'Failed to save file.');
        } finally {
            setTimeout(() => setIsSaving(false), 1000);
        }
    };

    const handleNewFile = async () => {
        let fileName = prompt("Enter new file name (e.g., 'new-doc.md'):", "new-file.md");
        if (fileName) {
            if (!fileName.includes('.')) fileName += '.md';
            const parentPath = selectedNode?.type === 'directory' ? selectedNode.path : (selectedNode?.path.substring(0, selectedNode.path.lastIndexOf('/')) || '/');
            const newPath = parentPath === '/' ? `/${fileName}` : `${parentPath}/${fileName}`;
            setActionError(null);
            try {
                await webcontainerService.writeFile(newPath, `# ${fileName}`);
                await loadTree();
            } catch (e) {
                setActionError(e instanceof Error ? e.message : 'Failed to create file.');
            }
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const content = await file.text();
            const parentPath = selectedNode?.type === 'directory' ? selectedNode.path : (selectedNode?.path.substring(0, selectedNode.path.lastIndexOf('/')) || '/');
            const newPath = parentPath === '/' ? `/${file.name}` : `${parentPath}/${file.name}`;
            setActionError(null);
            try {
                await webcontainerService.writeFile(newPath, content);
                await loadTree();
            } catch (e) {
                setActionError(e instanceof Error ? e.message : 'Failed to upload file.');
            }
        }
    };
    
    const handleZip = async () => {
        if (selectedNode?.type !== 'directory') return;
        setActionError(null);
        try {
            await webcontainerService.zipDirectory(selectedNode.path);
            await loadTree();
        } catch(e) {
             setActionError(e instanceof Error ? e.message : 'Failed to zip directory.');
        }
    };
    
    const handleUnzip = async () => {
        if (selectedNode?.type !== 'file' || !selectedNode.path.endsWith('.zip')) return;
        setActionError(null);
        try {
            await webcontainerService.unzipFile(selectedNode.path);
            await loadTree();
        } catch(e) {
             setActionError(e instanceof Error ? e.message : 'Failed to unzip file.');
        }
    };


    const currentStatus = selectedNode?.type === 'file' ? indexStatus.get(selectedNode.path) : undefined;
    const canIndex = currentStatus === 'NOT_INDEXED' || currentStatus === 'ERROR';
    
    const isDirSelected = selectedNode?.type === 'directory';
    const isFileSelected = selectedNode?.type === 'file';
    const isZipSelected = isFileSelected && selectedNode.path.endsWith('.zip');


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full text-yellow-400">
                <Spinner />
                <span className="ml-4 text-lg">Loading File System...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-full text-red-500">
                <span className="text-lg">Error: {error}</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <header className="flex-shrink-0 flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-neon-cyan tracking-widest drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">FILE EXPLORER & VECTOR STORE</h2>
                 <button onClick={() => {setIsLoading(true); loadTree();}} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7V9a1 1 0 01-2 0V4a1 1 0 011-1zm12 1a1 1 0 01.885.534A7.002 7.002 0 017.401 10.93a1 1 0 11-1.885-.666A5.002 5.002 0 0014.001 7V5a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Refresh
                </button>
            </header>
            <div className="flex-1 flex gap-6 min-h-0">
                <div className="w-1/3 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg p-4 overflow-y-auto">
                    <FileTree nodes={tree} onSelectNode={handleNodeSelect} selectedNode={selectedNode} indexStatus={indexStatus}/>
                </div>
                <div className="w-2/3 flex flex-col gap-4">
                    <div className="flex-shrink-0 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg p-2 flex items-center gap-2">
                        <h3 className="font-bold text-neon-cyan mr-2 flex-shrink-0">Actions:</h3>
                        <button onClick={handleNewFile} className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-1.5 px-3 rounded">New File</button>
                        <button onClick={handleUploadClick} className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-1.5 px-3 rounded">Upload</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <div className="border-l border-gray-600 h-6 mx-2"></div>
                        <button onClick={handleZip} disabled={!isDirSelected} className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold py-1.5 px-3 rounded">Zip</button>
                        <button onClick={handleUnzip} disabled={!isZipSelected} className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold py-1.5 px-3 rounded">Unzip</button>
                    </div>

                    <div className="flex-shrink-0 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-neon-pink mb-2 drop-shadow-[0_0_5px_rgba(255,0,255,0.7)]">Vector Search</h3>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g., 'summarize the project readme'" className="flex-1 bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-pink" />
                            <button type="submit" disabled={isSearching} className="bg-neon-pink hover:bg-opacity-80 text-black font-bold py-2 px-4 rounded transition-all shadow-md shadow-neon-pink/30 hover:shadow-lg hover:shadow-neon-pink/50 disabled:bg-gray-500 disabled:shadow-none disabled:text-gray-300 w-28 flex items-center justify-center">
                                {isSearching ? <Spinner /> : 'Search'}
                            </button>
                        </form>
                    </div>

                    <div className="flex-1 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg overflow-y-auto min-h-0 flex flex-col">
                        {actionError && <div className="p-2 bg-red-900/50 text-red-300 text-sm font-mono">{`ACTION ERROR: ${actionError}`}</div>}
                        {isSearching && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                        {searchResults && <div className="p-4"><CodeBlock content={searchResults} /></div>}
                        
                        {!isSearching && !searchResults && isFileSelected && (
                             <div className="h-full flex flex-col">
                                <header className="p-3 border-b border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-900/50">
                                    <h4 className="font-mono text-sm text-gray-300 truncate pr-4">{selectedNode.path}</h4>
                                    <div className="flex items-center gap-4">
                                        <button onClick={handleIndexFile} disabled={!canIndex} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-1 px-3 rounded transition-colors text-xs">
                                            {currentStatus === 'INDEXING' ? 'Indexing...' : (currentStatus === 'INDEXED' ? 'Indexed' : 'Index File')}
                                        </button>
                                        <button onClick={handleSaveContent} disabled={isSaving} className="bg-neon-lime hover:bg-opacity-80 text-black font-bold py-1 px-3 rounded transition-colors text-xs w-24 text-center shadow-neon-lime">
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </header>
                                <textarea 
                                    value={editableContent}
                                    onChange={e => setEditableContent(e.target.value)}
                                    className="flex-1 w-full bg-dark-bg text-gray-200 p-4 font-mono text-sm resize-none focus:outline-none"
                                    spellCheck="false"
                                />
                            </div>
                        )}
                        {!isSearching && !searchResults && !isFileSelected && (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>{isDirSelected ? `Selected directory: ${selectedNode.path}` : 'Select a file to edit or use Vector Search.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileExplorer;