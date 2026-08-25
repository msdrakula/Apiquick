export declare function runGit(cwd: string, args: string[]): {
    code: number;
    stdout: string;
    stderr: string;
};
export declare function gitAvailable(): boolean;
export declare function assertGitFolder(raw: string): string;
export declare function isGitRepo(folder: string): boolean;
/** If this repo has no committer identity, set a local one so commits work. */
export declare function ensureGitIdentity(folder: string): void;
export declare function safeFileName(name: string): string;
//# sourceMappingURL=git.d.ts.map