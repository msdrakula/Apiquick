import { URL } from 'url';
import { CounterCtx } from './variables';
export interface TimelineEntry {
    name: string;
    start: number;
    end: number;
}
export interface ExecuteOptions {
    method: string;
    url: string;
    headers: Array<{
        key: string;
        value: string;
        enabled?: boolean;
    }>;
    params: Array<{
        key: string;
        value: string;
        enabled?: boolean;
    }>;
    bodyType: string;
    bodyContent?: string;
    bodyRawType?: string;
    authType: string;
    auth: Record<string, any>;
    variables: Record<string, string>;
    preRequestScript?: string;
    testScript?: string;
    cookies: Array<{
        domain: string;
        name: string;
        value: string;
        path?: string;
    }>;
    incrementCounters?: boolean;
}
export interface ExecuteResult {
    status: number;
    statusText: string;
    headers: Array<{
        key: string;
        value: string;
        enabled?: boolean;
    }>;
    body: string;
    timeMs: number;
    timeline: TimelineEntry[];
    cookies: Array<{
        domain: string;
        name: string;
        value: string;
        path: string;
    }>;
    testResults?: Array<{
        name: string;
        passed: boolean;
        error?: string;
    }>;
    logs?: string[];
}
export declare function applyAuth(headers: Record<string, string>, url: URL, authType: string, auth: Record<string, any>): void;
export declare function runPmScript(script: string | undefined, context: any): {
    logs: string[];
    error?: string;
};
export declare function encodeFormBody(bodyContent: string, vars: Record<string, string>, counters?: CounterCtx): string;
export declare function encodeMultipartBody(bodyContent: string, vars: Record<string, string>, counters?: CounterCtx): {
    contentType: string;
    body: string;
};
export declare function executeRequest(opts: ExecuteOptions): Promise<ExecuteResult>;
//# sourceMappingURL=executor.d.ts.map