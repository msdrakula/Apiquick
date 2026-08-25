# Apiquick

Local API client (HTTP / collections / environments) built with Node.js, React, and Electron. Data stays on your machine.

## License

This is **not** MIT/GPL. See [`LICENSE`](LICENSE).

- **Natural persons / personal use:** free to download, install, and run as-is for **software testing and development**. No right to modify the code or build another product on it.
- **Legal entities** (companies, orgs, use on behalf of a business): **written permission required**.
- **No warranty.** If you use the software for anything other than testing and developing software, you do it **at your own risk**; the author is not liable.

## Run (Windows)

Unzip the repo (or clone), then double-click **`Apiquick Desktop.bat`**. It starts `nodejs\node.exe` and opens Chrome/Edge at `http://127.0.0.1:8765`.

The archive includes Node, backend `node_modules`, and built `backend/dist` + `frontend/dist`. It does **not** include `dist-package` (third-party app files) or your personal folder `Коллекции Postman`.

Dev (needs `frontend/node_modules`):

```text
backend: npm run dev
frontend: npm run dev
```

## Layout

| Path | Role |
|------|------|
| `backend/` | Express API, SQLite (sql.js) |
| `frontend/` | React UI |
| `desktop/` | Electron shell |
| `data/` | Local database (not for git) |
