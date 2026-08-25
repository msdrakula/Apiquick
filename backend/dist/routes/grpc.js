"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const grpc_js_1 = __importDefault(require("@grpc/grpc-js"));
const proto_loader_1 = __importDefault(require("@grpc/proto-loader"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        const { url, service, method, proto, message } = req.body;
        if (!url || !service || !method || !proto) {
            return res.status(400).json({ detail: 'Missing url, service, method or proto' });
        }
        // Write proto to temp file
        const tmpFile = path_1.default.join(os_1.default.tmpdir(), `apiquick-${Date.now()}.proto`);
        fs_1.default.writeFileSync(tmpFile, proto);
        try {
            const packageDefinition = proto_loader_1.default.loadSync(tmpFile, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            });
            const protoDescriptor = grpc_js_1.default.loadPackageDefinition(packageDefinition);
            const servicePath = service.split('.');
            let pkg = protoDescriptor;
            for (const part of servicePath) {
                pkg = pkg[part];
                if (!pkg)
                    throw new Error(`Service ${service} not found in proto`);
            }
            const client = new pkg(url, grpc_js_1.default.credentials.createInsecure());
            const methodFn = client[method];
            if (!methodFn)
                throw new Error(`Method ${method} not found`);
            const result = await new Promise((resolve, reject) => {
                methodFn.call(client, message || {}, (err, response) => {
                    if (err)
                        reject(err);
                    else
                        resolve(response);
                });
            });
            res.json({ result });
        }
        finally {
            try {
                fs_1.default.unlinkSync(tmpFile);
            }
            catch { }
        }
    }
    catch (err) {
        res.status(502).json({ detail: err.message || 'gRPC failed' });
    }
});
exports.default = router;
//# sourceMappingURL=grpc.js.map