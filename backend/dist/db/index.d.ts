export declare function initDb(dataDir?: string): Promise<void>;
export declare function run(sql: string, params?: any): void;
export declare function get(sql: string, params?: any): any;
export declare function all(sql: string, params?: any): any[];
export declare function exec(sql: string): void;
export declare function lastId(_table?: string): number;
export declare function closeDb(): void;
//# sourceMappingURL=index.d.ts.map