import fs from 'fs';
import path from 'path';
import chd from 'chokidar';
class Database {
    databaseName;
    dataType;
    filePath;
    db = {};
    isSelfWriting = false;
    constructor(databaseName, dataType) {
        this.databaseName = databaseName;
        this.dataType = dataType;
        const dirPath = path.resolve('structures');
        this.filePath = path.join(dirPath, `${databaseName}.json`);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        this.loadSync();
        this.initWatcher();
    }
    initWatcher() {
        chd.watch(this.filePath).on('change', () => {
            if (this.isSelfWriting)
                return;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            console.log("\x1b[34m%s\x1b[0m %s", "[ DATA ]", `: database changed externally - ${timeStr}`);
            this.loadSync();
        });
    }
    loadSync() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf8');
                this.db = JSON.parse(data || '{}');
            }
            else {
                this.db = {};
                this.save();
            }
        }
        catch (err) {
            console.error(`[ERROR] Fail to load database: ${this.databaseName}:`, err);
            this.db = {};
        }
    }
    save() {
        try {
            this.isSelfWriting = true;
            fs.writeFileSync(this.filePath, JSON.stringify(this.db, null, 2));
            setTimeout(() => { this.isSelfWriting = false; }, 100);
            return true;
        }
        catch (error) {
            this.isSelfWriting = false;
            return false;
        }
    }
    get(collection) {
        return this.db[collection] ?? false;
    }
    insert(collection, data) {
        this.db[collection] = data;
        return this.save();
    }
    update(collection, dotPath, value) {
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
    delete(collection, query) {
        if (!this.db[collection])
            return false;
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
            if (filtered.length === initialLength)
                return false;
            this.db[collection] = filtered;
            return this.save();
        }
        delete this.db[collection];
        return this.save();
    }
    all() {
        const values = Object.values(this.db);
        return this.dataType ? values.flat(1) : values;
    }
    has(value) {
        return this.all().some(item => {
            if (item && typeof item === 'object') {
                return Object.values(item).includes(value);
            }
            return item === value;
        });
    }
    robustSearch(value) {
        return this.all().find(item => {
            if (item && typeof item === 'object') {
                return Object.values(item).includes(value);
            }
            return item === value;
        }) ?? false;
    }
}
export default { Database };
