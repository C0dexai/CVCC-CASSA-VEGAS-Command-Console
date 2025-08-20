import { Task, Agent, LogEntry, ScheduledCommand } from '../types';

const DB_NAME = 'CassaVegasDB';
const DB_VERSION = 1;

const STORES = {
    tasks: 'tasks',
    agents: 'agents',
    logbook: 'logbook',
    scheduledCommands: 'scheduledCommands',
};

class DBService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    private init(): Promise<void> {
        // If DB is already initialized, we're good.
        if (this.db) {
            return Promise.resolve();
        }
        // If initialization is in progress, return the existing promise.
        if (this.initPromise) {
            return this.initPromise;
        }

        // Start initialization
        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                this.initPromise = null; // Allow retrying on failure
                reject('Error opening database.');
            };

            request.onsuccess = () => {
                this.db = request.result;
                // Don't reset initPromise, subsequent calls will hit the `if (this.db)` case.
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORES.tasks)) {
                    db.createObjectStore(STORES.tasks, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.agents)) {
                    db.createObjectStore(STORES.agents, { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains(STORES.logbook)) {
                    db.createObjectStore(STORES.logbook, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.scheduledCommands)) {
                    const store = db.createObjectStore(STORES.scheduledCommands, { keyPath: 'id' });
                    store.createIndex('executeAt', 'executeAt', { unique: false });
                }
            };
        });
        return this.initPromise;
    }

    private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
        await this.init();
        if (!this.db) {
            throw new Error("Database could not be initialized.");
        }
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }
    
    private async getAll<T>(storeName: string): Promise<T[]> {
        const store = await this.getStore(storeName, 'readonly');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    private async saveAll<T>(storeName: string, items: T[]): Promise<void> {
        const store = await this.getStore(storeName, 'readwrite');
        const transaction = store.transaction;

        // Clear the store and add all new items within the same transaction
        store.clear();
        items.forEach(item => {
            store.put(item);
        });

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    private async add<T>(storeName: string, item: T): Promise<void> {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
             const request = store.add(item);
             request.onsuccess = () => resolve();
             request.onerror = () => reject(request.error);
        });
    }

    public getTasks = () => this.getAll<Task>(STORES.tasks);
    public saveTasks = (tasks: Task[]) => this.saveAll<Task>(STORES.tasks, tasks);

    public getAgents = () => this.getAll<Agent>(STORES.agents);
    public saveAgents = (agents: Agent[]) => this.saveAll<Agent>(STORES.agents, agents);

    public getLogbook = () => this.getAll<LogEntry>(STORES.logbook);
    public addLogEntry = (entry: LogEntry) => this.add<LogEntry>(STORES.logbook, entry);

    public getScheduledCommands = () => this.getAll<ScheduledCommand>(STORES.scheduledCommands);
    public saveScheduledCommands = (commands: ScheduledCommand[]) => this.saveAll<ScheduledCommand>(STORES.scheduledCommands, commands);
}

export const dbService = new DBService();