export type CounterCtx = {
    value: (name: string) => string;
};
export declare function replaceVariables(text: string, variables: Record<string, string>, counters?: CounterCtx): string;
export declare function buildVariables(envId: number | null, envs: any[]): Record<string, string>;
export declare function getPredefinedVariables(): Record<string, string>;
export declare function makeExecuteCounters(increment: boolean): {
    value(name: string): string;
};
//# sourceMappingURL=variables.d.ts.map