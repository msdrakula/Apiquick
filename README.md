# Apiquick

Local API client (HTTP / collections / environments) built with Node.js, React, and Electron. Data stays on your machine.

## License

This is **not** MIT/GPL. See [`LICENSE`](LICENSE).

- **Natural persons / personal use:** free to download, install, and run as-is for **software testing and development**. No right to modify the code or build another product on it.
- **Legal entities** (companies, orgs, use on behalf of a business): **written permission required**.
- **No warranty.** If you use the software for anything other than testing and developing software, you do it **at your own risk**; the author is not liable.

## Run (Windows)

From the project root, after installing dependencies:

```text
nodejs\node.exe backend\dist\index.js
```

Or use `Apiquick Desktop.bat` if you have a local Node binary in `nodejs\`.

Dev:

```text
backend: npm run dev
frontend: npm run dev
```

API listens on `http://127.0.0.1:8765`.

## Layout

| Path | Role |
|------|------|
| `backend/` | Express API, SQLite (sql.js) |
| `frontend/` | React UI |
| `desktop/` | Electron shell |
| `data/` | Local database (not for git) |
