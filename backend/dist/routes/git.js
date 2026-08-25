"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../db");
const settings_1 = require("../utils/settings");
const git_1 = require("../utils/git");
const secrets_1 = require("../utils/secrets");
const postmanExport_1 = require("../utils/postmanExport");
const router = (0, express_1.Router)();
function folderOrThrow() {
    return (0, git_1.assertGitFolder)((0, settings_1.getSetting)('git_folder', ''));
}
function statusPayload(folder) {
    const available = (0, git_1.gitAvailable)();
    const repo = available && (0, git_1.isGitRepo)(folder);
    let branch = '';
    let files = [];
    let porcelain = '';
    if (repo) {
        const b = (0, git_1.runGit)(folder, ['rev-parse', '--abbrev-ref', 'HEAD']);
        branch = b.stdout || '';
        const st = (0, git_1.runGit)(folder, ['status', '--porcelain']);
        porcelain = st.stdout;
        files = porcelain ? porcelain.split(/\r?\n/).filter(Boolean) : [];
    }
    return { folder, available, repo, branch, files, dirty: files.length > 0 };
}
router.get('/status', (_req, res) => {
    try {
        const saved = (0, settings_1.getSetting)('git_folder', '');
        if (!saved)
            return res.json({ folder: '', available: (0, git_1.gitAvailable)(), repo: false, branch: '', files: [], dirty: false });
        const folder = (0, git_1.assertGitFolder)(saved);
        res.json(statusPayload(folder));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.put('/folder', (req, res) => {
    try {
        const folder = (0, git_1.assertGitFolder)(req.body?.path || '');
        (0, settings_1.setSetting)('git_folder', folder);
        res.json(statusPayload(folder));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.post('/init', (_req, res) => {
    try {
        if (!(0, git_1.gitAvailable)())
            return res.status(400).json({ error: 'git is not installed or not on PATH' });
        const folder = folderOrThrow();
        if ((0, git_1.isGitRepo)(folder)) {
            (0, git_1.ensureGitIdentity)(folder);
            return res.json({ ok: true, ...statusPayload(folder) });
        }
        const r = (0, git_1.runGit)(folder, ['init']);
        if (r.code !== 0)
            return res.status(500).json({ error: r.stderr || 'git init failed' });
        (0, git_1.ensureGitIdentity)(folder);
        const gi = path_1.default.join(folder, '.gitignore');
        if (!fs_1.default.existsSync(gi))
            fs_1.default.writeFileSync(gi, '.DS_Store\nThumbs.db\n', 'utf8');
        res.json({ ok: true, ...statusPayload(folder) });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.post('/sync', (_req, res) => {
    try {
        const folder = folderOrThrow();
        const colDir = path_1.default.join(folder, 'collections');
        const envDir = path_1.default.join(folder, 'environments');
        fs_1.default.mkdirSync(colDir, { recursive: true });
        fs_1.default.mkdirSync(envDir, { recursive: true });
        const collections = (0, db_1.all)('SELECT * FROM collections ORDER BY id');
        const written = [];
        for (const col of collections) {
            const data = (0, postmanExport_1.loadCollectionExport)(col);
            const file = path_1.default.join(colDir, (0, git_1.safeFileName)(col.name) + '.postman_collection.json');
            fs_1.default.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
            written.push(path_1.default.relative(folder, file));
        }
        const envs = (0, db_1.all)('SELECT * FROM environments ORDER BY id');
        for (const env of envs) {
            let variables = [];
            try {
                variables = JSON.parse(env.variables || '[]');
            }
            catch {
                variables = [];
            }
            variables = (0, secrets_1.decryptVarList)(Array.isArray(variables) ? variables : []).map((v) => (v && v.secret ? { ...v, value: '' } : v));
            const file = path_1.default.join(envDir, (0, git_1.safeFileName)(env.name) + '.json');
            fs_1.default.writeFileSync(file, JSON.stringify({ name: env.name, variables }, null, 2), 'utf8');
            written.push(path_1.default.relative(folder, file));
        }
        res.json({ ok: true, written, ...statusPayload(folder) });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.post('/commit', (req, res) => {
    try {
        if (!(0, git_1.gitAvailable)())
            return res.status(400).json({ error: 'git is not installed or not on PATH' });
        const message = String(req.body?.message || '').trim();
        if (!message)
            return res.status(400).json({ error: 'Commit message is required' });
        const folder = folderOrThrow();
        if (!(0, git_1.isGitRepo)(folder))
            return res.status(400).json({ error: 'Folder is not a git repository. Click Init first.' });
        (0, git_1.ensureGitIdentity)(folder);
        const add = (0, git_1.runGit)(folder, ['add', '-A']);
        if (add.code !== 0)
            return res.status(500).json({ error: add.stderr || 'git add failed' });
        const commit = (0, git_1.runGit)(folder, ['commit', '-m', message]);
        if (commit.code !== 0) {
            const text = (commit.stderr || commit.stdout || 'git commit failed');
            if (/nothing to commit/i.test(text))
                return res.json({ ok: true, empty: true, ...statusPayload(folder) });
            return res.status(500).json({ error: text });
        }
        res.json({ ok: true, log: commit.stdout, ...statusPayload(folder) });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=git.js.map