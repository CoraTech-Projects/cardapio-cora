import fs from 'fs';
import path from 'path';
import chd from 'chokidar';

interface IDatabaseContent {
  [collection: string]: any;
}

class Database {
  private readonly filePath: string;
  private db: IDatabaseContent = {};
  private isSelfWriting: boolean = false;

  constructor(
    public readonly databaseName: string,
    private readonly dataType: boolean
  ) {
    const dirPath = path.resolve('assets/structures');
    this.filePath = path.join(dirPath, `${databaseName}.json`);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    this.loadSync();
    this.initWatcher();
  }

  private initWatcher(): void {
    chd.watch(this.filePath).on('change', () => {
      if (this.isSelfWriting) return;
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      console.log("\x1b[34m%s\x1b[0m %s", "[ DATA ]", `: database changed externally - ${timeStr}`);
      
      this.loadSync();
    });
  }

  private loadSync(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        this.db = JSON.parse(data || '{}');
      } else {
        this.db = {};
        this.save();
      }
    } catch (err) {
      console.error(`[ERROR] Fail to load database: ${this.databaseName}:`, err);
      this.db = {};
    }
  }

  private save(): boolean {
    try {
      this.isSelfWriting = true;
      fs.writeFileSync(this.filePath, JSON.stringify(this.db, null, 2));
 
      setTimeout(() => { this.isSelfWriting = false; }, 100);
      return true;
    } catch (error) {
      this.isSelfWriting = false;
      return false;
    }
  }

  public get<T = any>(collection: string): T | false {
    return this.db[collection] ?? false;
  }

  public insert(collection: string, data: any): boolean {

    this.db[collection] = data;
    return this.save();
  }

  public update(collection: string, dotPath: string, value: any): boolean {
    const keys = dotPath.split('.');
    
    if (!this.db[collection]) {
      this.db[collection] = {};
    }

    let target = this.db[collection];
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    target[keys[keys.length - 1]] = value;
    return this.save();
  }

  public delete(collection: string, query?: Record<string, any>): boolean {
    if (!this.db[collection]) return false;

    if (!query) {
      delete this.db[collection];
      return this.save();
    }

    const records = this.db[collection];

    if (Array.isArray(records) && this.dataType) {
      const initialLength = records.length;
      const filtered = records.filter(item => {
        return !Object.keys(query).every(key => item[key] === query[key]);
      });

      if (filtered.length === initialLength) return false;
      
      this.db[collection] = filtered;
      return this.save();
    } 
    
    delete this.db[collection];
    return this.save();
  }

  public all(): any[] {
    const values = Object.values(this.db);
    return this.dataType ? values.flat(1) : values;
  }

  public has(value: any): boolean {
    return this.all().some(item => {
      if (item && typeof item === 'object') {
        return Object.values(item).includes(value);
      }
      return item === value;
    });
  }

  public robustSearch(value: any): any | false {
    return this.all().find(item => {
      if (item && typeof item === 'object') {
        return Object.values(item).includes(value);
      }
      return item === value;
    }) ?? false;
  }
}

export default { Database };
