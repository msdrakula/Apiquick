"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const app_1 = require("./app");
async function main() {
    await (0, db_1.initDb)();
    const app = (0, app_1.createApp)();
    const PORT = Number(process.env.PORT || 8765);
    const HOST = process.env.HOST || '127.0.0.1';
    app.listen(PORT, HOST, () => {
        console.log(`Apiquick server running at http://${HOST}:${PORT}`);
    });
}
main().catch(console.error);
//# sourceMappingURL=index.js.map