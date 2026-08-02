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
    const dirPath = path.resolve('src/structures');
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
      const timeStr = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      console.log(
        '\x1b[34m%s\x1b[0m %s',
        ' [ DATA ]:',
        ` database changed externally - ${timeStr}`
      );

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
      console.error(
        `[ERROR] Fail to load database: ${this.databaseName}:`,
        err
      );
      this.db = {};
    }
  }

  private save(): boolean {
    try {
      this.isSelfWriting = true;
      fs.writeFileSync(this.filePath, JSON.stringify(this.db, null, 2));

      setTimeout(() => {
        this.isSelfWriting = false;
      }, 100);
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
    if (!this.db[collection]) {
      // Initialize collection based on provided data shape when absent
      this.db[collection] = Array.isArray(data) ? [] : {};
    }

    if (Array.isArray(this.db[collection])) {
      if (Array.isArray(data)) {
        this.db[collection].push(...data);
      } else {
        this.db[collection].push(data);
      }
      return this.save();
    }

    // For object collections, assign directly
    this.db[collection] = data;
    return this.save();
  }

  private findArrayElement(
    arr: any[],
    identifier: string
  ): { item: any; index: number } | null {
    if (!Array.isArray(arr)) return null;

    if (/^\d+$/.test(identifier)) {
      const index = Number(identifier);
      if (arr[index] !== undefined) {
        return { item: arr[index], index };
      }
    }

    const keyCandidates = ['id', 'dia', 'name', 'identifier'];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (item && typeof item === 'object') {
        if (keyCandidates.some((key) => item[key] === identifier)) {
          return { item, index: i };
        }
      }
    }

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (item && typeof item === 'object') {
        if (Object.values(item).includes(identifier)) {
          return { item, index: i };
        }
      } else if (item === identifier) {
        return { item, index: i };
      }
    }

    return null;
  }

  public update(collection: string, dotPath: string, value: any): boolean {
    const keys = dotPath.split('.');

    if (!this.db[collection]) {
      // Default to object for nested updates; arrays are created explicitly via insert
      this.db[collection] = {};
    }

    let target = this.db[collection];

    if (Array.isArray(target) && this.dataType) {
      const [firstKey, ...restKeys] = keys;
      const entry = this.findArrayElement(target, firstKey);

      if (!entry) {
        if (restKeys.length === 0 && typeof value === 'object') {
          target.push(value);
          return this.save();
        }
        return false;
      }

      if (restKeys.length === 0) {
        target[entry.index] = value;
        return this.save();
      }

      let arrayTarget = entry.item;
      for (let i = 0; i < restKeys.length - 1; i++) {
        const key = restKeys[i];
        if (!(key in arrayTarget) || typeof arrayTarget[key] !== 'object') {
          arrayTarget[key] = {};
        }
        arrayTarget = arrayTarget[key];
      }

      arrayTarget[restKeys[restKeys.length - 1]] = value;
      return this.save();
    }

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

  private deleteNested(collection: string, dotPath: string): boolean {
    if (!this.db[collection]) {
      return false;
    }

    const keys = dotPath.split('.');
    let target: any = this.db[collection];

    if (Array.isArray(target) && this.dataType) {
      const entry = this.findArrayElement(target, dotPath);
      if (!entry) {
        return false;
      }
      target.splice(entry.index, 1);
      return this.save();
    }

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in target) || typeof target[key] !== 'object') {
        return false;
      }
      target = target[key];
    }

    const lastKey = keys[keys.length - 1];
    if (!(lastKey in target)) {
      return false;
    }

    delete target[lastKey];
    return this.save();
  }

  public delete(
    collection: string,
    query?: Record<string, any> | string
  ): boolean {
    if (typeof query === 'string') {
      return this.deleteNested(collection, query);
    }

    if (!this.db[collection]) return false;

    if (!query) {
      delete this.db[collection];
      return this.save();
    }

    const records = this.db[collection];

    if (Array.isArray(records) && this.dataType) {
      const initialLength = records.length;
      const filtered = records.filter((item) => {
        return !Object.keys(query).every((key) => item[key] === query[key]);
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

  private getNestedFromArray(target: any[], key: string): any {
    const entry = this.findArrayElement(target, key);
    return entry ? entry.item : undefined;
  }

  public has(value: any): boolean {
    // Verifica se há um caminho profundo (collection.key ou collection.key.subkey)
    if (typeof value === 'string' && value.includes('.')) {
      const keys = value.split('.');
      let target: any = this.db;

      for (const key of keys) {
        if (Array.isArray(target) && this.dataType) {
          target = this.getNestedFromArray(target, key);
        } else if (target && typeof target === 'object' && key in target) {
          target = target[key];
        } else {
          return false;
        }
      }
      return target !== undefined;
    }

    // Comportamento original para valores simples e coleções
    return (
      this.all().some((item) => {
        if (item && typeof item === 'object') {
          return Object.values(item).includes(value);
        }
        return item === value;
      }) || this.db[value]
    );
  }

  public robustSearch(value: any): any | false {
    return (
      this.all().find((item) => {
        if (item && typeof item === 'object') {
          return Object.values(item).includes(value);
        }
        return item === value;
      }) ?? false
    );
  }
}

export default { Database };
