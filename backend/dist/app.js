"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const collections_1 = __importDefault(require("./routes/collections"));
const requests_1 = __importDefault(require("./routes/requests"));
const environments_1 = __importDefault(require("./routes/environments"));
const history_1 = __importDefault(require("./routes/history"));
const execute_1 = __importDefault(require("./routes/execute"));
const cookies_1 = __importDefault(require("./routes/cookies"));
const globals_1 = __importDefault(require("./routes/globals"));
const import_export_1 = __importDefault(require("./routes/import-export"));
const grpc_1 = __importDefault(require("./routes/grpc"));
const settings_1 = __importDefault(require("./routes/settings"));
const git_1 = __importDefault(require("./routes/git"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: [
            'http://127.0.0.1:3000',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            'http://127.0.0.1:8765',
            'http://localhost:8765',
        ],
    }));
    app.use(express_1.default.json({ limit: '50mb' }));
    app.get('/health', (_req, res) => {
        res.json({ ok: true, name: 'apiquick' });
    });
    app.use('/collections', collections_1.default);
    app.use('/requests', requests_1.default);
    app.use('/environments', environments_1.default);
    app.use('/history', history_1.default);
    app.use('/execute', execute_1.default);
    app.use('/cookies', cookies_1.default);
    app.use('/globals', globals_1.default);
    app.use('/import-export', import_export_1.default);
    app.use('/execute-grpc', grpc_1.default);
    app.use('/settings', settings_1.default);
    app.use('/git', git_1.default);
    const frontendDist = path_1.default.join(__dirname, '..', '..', 'frontend', 'dist');
    app.use(express_1.default.static(frontendDist));
    app.get('*', (req, res, next) => {
        if (req.method !== 'GET')
            return next();
        if (req.path.startsWith('/api'))
            return next();
        res.sendFile(path_1.default.join(frontendDist, 'index.html'), (err) => {
            if (err)
                next();
        });
    });
    return app;
}
//# sourceMappingURL=app.js.map