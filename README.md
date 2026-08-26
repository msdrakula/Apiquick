# Apiquick

Local API client (HTTP / collections / environments). Data stays on your machine.

Локальный клиент API (HTTP, коллекции, окружения). Данные остаются на вашем компьютере.

---

## Как запустить / How to run

### Русский

#### Что это за запуск

Apiquick — не «установщик из магазина». Это папка с программой. Сервер слушает только `http://127.0.0.1:8765` (ваш компьютер, не интернет). Интерфейс открывается в Chrome или Edge в режиме окна приложения.

Нужна **Windows**. В архиве с GitHub уже есть `nodejs\node.exe`, собранный сервер `backend\dist` и интерфейс `frontend\dist`. Отдельно ставить Node.js с nodejs.org **не обязательно**, если вы скачали полный архив ветки `main` после коммита с рантаймом.

#### 1. Скачать

1. Откройте https://github.com/msdrakula/Apiquick
2. Кнопка зелёная **Code** → **Download ZIP**
3. Распакуйте ZIP в любое место, например `C:\Apps\Apiquick-main`  
   (GitHub называет папку `Apiquick-main` или `Apiquick-<ветка>`.)
4. Зайдите **внутрь** этой папки. Рядом должны быть файлы:
   - `Apiquick Desktop.bat`
   - `Start Apiquick.vbs`
   - `run.bat`
   - папки `nodejs`, `backend`, `frontend`

Не запускайте bat из «проводника внутри ZIP» — сначала распакуйте.

#### 2. Обычный запуск (рекомендуется)

1. Дважды щёлкните **`Apiquick Desktop.bat`**.
2. Подождите 1–3 секунды. Скрипт:
   - переходит в папку, где лежит bat (путь на диске может быть любым);
   - запускает `nodejs\node.exe backend\dist\index.js`;
   - ищет Google Chrome, затем Microsoft Edge;
   - открывает `http://127.0.0.1:8765` в режиме `--app` (окно без обычной панели вкладок браузера).
3. Если Chrome и Edge не найдены в стандартных путях, откроется системный браузер по умолчанию на том же адресе.

Окно чёрной консоли может мелькнуть и закрыться — это нормально: сервер уходит в фон.

#### 3. Другие способы

| Файл | Что делает |
|------|------------|
| `Apiquick Desktop.bat` | Сервер + браузер. Основной способ. |
| `run.bat` | Только сервер, окно консоли **остаётся открытым**. Браузер сами откройте на `http://127.0.0.1:8765`. Удобно, если нужно видеть ошибки в тексте. |
| `Start Apiquick.vbs` | Показывает короткое сообщение «Apiquick is starting…» и запускает сервер без консоли. **Браузер сам не открывает** — перейдите в Chrome/Edge на `http://127.0.0.1:8765`. |

Ярлык `.lnk` с рабочего стола на GitHub не кладётся: в нём зашит путь конкретного ПК. Сделайте новый ярлык сами: правый клик по `Apiquick Desktop.bat` → «Создать ярлык».

#### 4. Как остановить

- Если запускали **`run.bat`**: закройте чёрное окно консоли или нажмите `Ctrl+C` в нём.
- Если запускали **`Apiquick Desktop.bat`** или **`.vbs`**: сервер работает в фоне. Диспетчер задач → завершите `node.exe` (путь вида `...\Apiquick...\nodejs\node.exe`), либо в командной строке:

```bat
taskkill /IM node.exe /F
```

Осторожно: `taskkill` убьёт **все** процессы `node.exe` на компьютере.

Закрытие вкладки браузера **не** выключает сервер.

#### 5. Если не открывается

1. Папка должна содержать `nodejs\node.exe` и `backend\dist\index.js`. Если их нет — скачан старый/урезанный архив. Скачайте ZIP с ветки `main` ещё раз.
2. Не переименовывайте так, чтобы сломать структуру: `nodejs`, `backend\dist`, `frontend\dist` должны остаться как в репозитории.
3. Порт **8765** занят — закройте предыдущий Apiquick / другой `node` и запустите снова.
4. Браузер пишет «не удаётся получить доступ к сайту» — подождите пару секунд и обновите страницу или откройте вручную: http://127.0.0.1:8765
5. Антивирус мог заблокировать `nodejs\node.exe` — разрешите файл в папке проекта.
6. Запуск с сетевого диска / OneDrive иногда ломает пути. Скопируйте папку на локальный диск (`C:`).

Проверка, что сервер жив: в браузере откройте http://127.0.0.1:8765/health — должен быть JSON с `"ok": true`.

#### 6. Данные

Коллекции и история пишутся в локальную базу в папке `data\` (файл создаётся при первом запуске). Эта база **не** входит в git. Бэкап = скопировать папку `data`.

Готовые примеры (для следующего релиза на GitHub и Import в Apiquick):

- `examples/collections/Testing-Challenges.postman_collection.json` — задания [thetestingmap.org](http://testingchallenges.thetestingmap.org/)
- `examples/collections/Apiquick-Self-Test.postman_collection.json` — проверка самого Apiquick на `127.0.0.1:8765`

Import → выбрать файл. Рабочие коллекции из `Коллекции Postman\` в git **не** кладутся.

#### 7. Кнопка Git в программе

Это **не** вход в GitHub и **не** публикация Apiquick. Кнопка **Git** в шапке сохраняет **ваши коллекции** в отдельную папку на диске и делает локальный коммит.

1. Укажите **абсолютный путь** к существующей папке → **Set**.
2. **Init repo** — `git init` в этой папке (нужен `git` в PATH, например Git for Windows).
3. **Sync collections** — пишет `collections\{имя}.postman_collection.json` и `environments\{имя}.json`. У секретных переменных окружения значения **не записываются**.
4. **Commit** — локальный `git commit` с вашим сообщением.

**Двухфакторная аутентификация GitHub сюда не относится:** Apiquick на сервер не логинится и `git push` не делает. Живая копия коллекций по-прежнему в `data\`. Чтобы выложить папку на GitHub, после коммита сами сделайте `git remote` / `git push` (HTTPS + token, SSH-ключ или GitHub Desktop) — 2FA спрашивается там, не в Apiquick.

#### 8. Режим разработки (не нужен для обычной работы)

Нужны зависимости фронтенда (`frontend\node_modules`). Их нет в ZIP «для запуска». На машине с npm:

```bat
cd frontend
npm install
npm run dev
```

```bat
cd backend
npm run dev
```

UI разработки обычно на порту Vite (например 5173), API — 8765.

Electron (`desktop\`, `npm start` в `desktop`) — отдельная оболочка, в ZIP её рантайма нет.

---

### English

#### What you are running

Apiquick is a **folder**, not a Store installer. The server binds to `http://127.0.0.1:8765` only (localhost, not the public internet). The UI opens in Chrome or Edge as an app-style window.

**Windows** is required. A current GitHub `main` ZIP already includes `nodejs\node.exe`, `backend\dist`, and `frontend\dist`. You do **not** need to install Node.js from nodejs.org if that archive is complete.

#### 1. Download

1. Open https://github.com/msdrakula/Apiquick
2. Green **Code** button → **Download ZIP**
3. Extract the ZIP anywhere, e.g. `C:\Apps\Apiquick-main`  
   (GitHub names the folder `Apiquick-main` or `Apiquick-<branch>`.)
4. Open **that folder**. You should see:
   - `Apiquick Desktop.bat`
   - `Start Apiquick.vbs`
   - `run.bat`
   - folders `nodejs`, `backend`, `frontend`

Do not run the `.bat` from inside the ZIP preview — extract first.

#### 2. Normal start (recommended)

1. Double-click **`Apiquick Desktop.bat`**.
2. Wait 1–3 seconds. The script:
   - uses the folder where the `.bat` lives (any disk path is fine);
   - starts `nodejs\node.exe backend\dist\index.js`;
   - looks for Google Chrome, then Microsoft Edge;
   - opens `http://127.0.0.1:8765` with `--app` (a window without the usual browser tab strip).
3. If Chrome and Edge are not in the default install paths, your default browser opens that URL instead.

A console window may flash and close; the server keeps running in the background.

#### 3. Other launchers

| File | What it does |
|------|----------------|
| `Apiquick Desktop.bat` | Server + browser. Use this. |
| `run.bat` | Server only; **console stays open**. Open `http://127.0.0.1:8765` yourself. Use this to read error text. |
| `Start Apiquick.vbs` | Shows “Apiquick is starting…” and starts the server with no console. **Does not open a browser** — go to `http://127.0.0.1:8765` in Chrome/Edge. |

Desktop `.lnk` shortcuts are not in git (they store an absolute path). Create your own: right-click `Apiquick Desktop.bat` → Create shortcut.

#### 4. How to stop

- If you used **`run.bat`**: close the console window or press `Ctrl+C`.
- If you used **`Apiquick Desktop.bat`** or **`.vbs`**: the server is in the background. Task Manager → end `node.exe` whose path is `...\Apiquick...\nodejs\node.exe`, or:

```bat
taskkill /IM node.exe /F
```

Warning: that command stops **every** `node.exe` on the machine.

Closing the browser does **not** stop the server.

#### 5. If it does not open

1. The folder must contain `nodejs\node.exe` and `backend\dist\index.js`. If they are missing, you have an old/incomplete ZIP. Download `main` again.
2. Keep the layout: `nodejs`, `backend\dist`, `frontend\dist` as in the repo.
3. Port **8765** in use — quit the previous Apiquick/Node process and retry.
4. Browser “can’t reach this page” — wait a few seconds, refresh, or open http://127.0.0.1:8765 manually.
5. Antivirus may block `nodejs\node.exe` — allow it in the project folder.
6. Network drives / OneDrive can break paths. Copy the folder to a local disk (`C:`).

Health check: http://127.0.0.1:8765/health should return JSON with `"ok": true`.

#### 6. Data

Collections and history go to a local database under `data\` (created on first run). That file is **not** in git. Backup = copy the `data` folder.

Starter collections (include in the next GitHub release; Import in Apiquick):

- `examples/collections/Testing-Challenges.postman_collection.json` — [thetestingmap.org](http://testingchallenges.thetestingmap.org/) form challenges
- `examples/collections/Apiquick-Self-Test.postman_collection.json` — self-test against `127.0.0.1:8765`

Import → pick the file. Personal dumps under `Коллекции Postman\` stay off git.

#### 7. The Git button in the app

This is **not** GitHub login and **not** publishing Apiquick. The **Git** button in the header writes **your collections** to a folder on disk and makes a local commit.

1. Enter an **absolute path** to an existing folder → **Set**.
2. **Init repo** — `git init` in that folder (`git` must be on PATH, e.g. Git for Windows).
3. **Sync collections** — writes `collections\{name}.postman_collection.json` and `environments\{name}.json`. Secret environment values are **not** written.
4. **Commit** — local `git commit` with your message.

**GitHub two-factor authentication does not apply here:** Apiquick does not log in to a remote and does not `git push`. The live copy of collections stays in `data\`. To publish that folder to GitHub, run `git remote` / `git push` yourself (HTTPS + token, SSH key, or GitHub Desktop). 2FA is handled there, not inside Apiquick.

#### 8. Development (not needed for normal use)

Needs `frontend\node_modules`, which is **not** in the run-ready ZIP. With npm:

```bat
cd frontend
npm install
npm run dev
```

```bat
cd backend
npm run dev
```

Vite UI is typically on another port (e.g. 5173); the API stays on 8765.

Electron (`desktop\`, `npm start` there) is a separate shell; its runtime is not in the ZIP.

---

## License

This is **not** MIT/GPL. See [`LICENSE`](LICENSE).

- **Natural persons / personal use:** free to download, install, and run as-is for **software testing and development**. No right to modify the code or build another product on it.
- **Legal entities** (companies, orgs, use on behalf of a business): **written permission required**.
- **No warranty.** If you use the software for anything other than testing and developing software, you do it **at your own risk**; the author is not liable.

The ZIP does **not** include `dist-package` (third-party app files) or the personal folder `Коллекции Postman`.

## Layout

| Path | Role |
|------|------|
| `backend/` | Express API, SQLite (sql.js) |
| `frontend/` | React UI |
| `desktop/` | Electron shell (optional) |
| `nodejs/` | Bundled Node.js for Windows |
| `data/` | Local database (created at runtime, not in git) |
| `examples/collections/` | Starter Postman JSON (Testing Challenges, Apiquick self-test) |
