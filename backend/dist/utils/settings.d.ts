export declare function getSetting(key: string, fallback?: string): string;
export declare function setSetting(key: string, value: string): void;
export declare function getAllowlist(): {
    enabled: boolean;
    hosts: string[];
};
export declare function isHostAllowed(hostname: string): boolean;
//# sourceMappingURL=settings.d.ts.map