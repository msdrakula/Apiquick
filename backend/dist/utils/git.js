"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGit = runGit;
exports.gitAvailable = gitAvailable;
exports.assertGitFolder = assertGitFolder;
exports.isGitRepo = isGitRepo;
exports.ensureGitIdentity = ensureGitIdentity;
exports.safeFileName = safeFileName;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function runGit(cwd, args) {
    const r = (0, child_process_1.spawnSync)('git', args, {
        cwd,
        encoding: 'utf8',
        windowsHide: true,
        timeout: 30000,
    });
    return {
        code: r.status == null ? 1 : r.status,
        stdout: (r.stdout || '').trim(),
        stderr: (r.stderr || '').trim() || (r.error ? r.error.message : ''),
    };
}
function gitAvailable() {
    const r = (0, child_process_1.spawnSync)('git', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 8000 });
    return r.status === 0;
}
function assertGitFolder(raw) {
    if (!raw || typeof raw !== 'string')
        throw new Error('Folder path is required');
    const resolved = path_1.default.resolve(raw.trim());
    if (!path_1.default.isAbsolute(resolved))
        throw new Error('Folder path must be absolute');
    if (!fs_1.default.existsSync(resolved))
        throw new Error('Folder does not exist: ' + resolved);
    if (!fs_1.default.statSync(resolved).isDirectory())
        throw new Error('Path is not a folder: ' + resolved);
    return resolved;
}
function isGitRepo(folder) {
    const r = runGit(folder, ['rev-parse', '--is-inside-work-tree']);
    return r.code === 0 && r.stdout === 'true';
}
/** If this repo has no committer identity, set a local one so commits work. */
function ensureGitIdentity(folder) {
    const name = runGit(folder, ['config', 'user.name']);
    if (name.code !== 0 || !name.stdout) {
        runGit(folder, ['config', 'user.name', 'Apiquick']);
    }
    const email = runGit(folder, ['config', 'user.email']);
    if (email.code !== 0 || !email.stdout) {
        runGit(folder, ['config', 'user.email', 'apiquick@local']);
    }
}
function safeFileName(name) {
    return (name || 'untitled').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'untitled';
}
//# sourceMappingURL=git.js.map