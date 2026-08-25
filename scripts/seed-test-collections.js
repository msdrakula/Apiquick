const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8765';
const COL_DIR = path.join(__dirname, '..', 'Коллекции Postman');

function header(json = false) {
  return json
    ? [{ key: 'Content-Type', value: 'application/json' }]
    : [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }];
}

function tests(lines) {
  return [{ listen: 'test', script: { type: 'text/javascript', exec: lines } }];
}

function urlencoded(fields) {
  return {
    mode: 'urlencoded',
    urlencoded: Object.entries(fields).map(([key, value]) => ({ key, value: String(value) })),
  };
}

function rawJson(obj) {
  return {
    mode: 'raw',
    raw: JSON.stringify(obj, null, 2),
    options: { raw: { language: 'json' } },
  };
}

function req(name, method, url, opts = {}) {
  const item = {
    name,
    request: {
      method,
      header: opts.header || [],
      url,
    },
  };
  if (opts.body) item.request.body = opts.body;
  if (opts.event) item.event = opts.event;
  return item;
}

function folder(name, items) {
  return { name, item: items };
}

const c1Hidden = {
  firstexecution: '1',
  found: '0',
  golhart: '',
  sartepace: '',
  tgrgr: '',
  GGTTre: '',
  preaprea: '',
  listsoftests: '',
  mmmmret: '',
  mfmmfdmret: '',
  hrgefed: '',
  apo: '',
  scrt: '',
  httersv: '',
  httdsfrgersv: '',
  user_right_as_admin: '0',
  sopedace: '',
  hds3ref: '',
  sctte75rt: '',
  xcfetrwdst: '',
  xfhqmsntowt: '',
  httr3gfdersv: '',
  formSubmit: 'Submit',
};

function c1(firstname, extra = {}) {
  return urlencoded({ firstname, ...c1Hidden, ...extra });
}

const statusOk = tests([
  'pm.test("HTTP 200", function () {',
  '  pm.expect(pm.response.code).to.equal(200);',
  '});',
]);

const challenges = {
  info: {
    name: 'Testing Challenges — thetestingmap.org',
    description:
      'Запросы по заданиям http://testingchallenges.thetestingmap.org/\n\nСайт — это веб-формы, не REST API. Каждый запрос — один кейс. Не гоняй коллекцию целиком: лимит ~30 req/s на IP.\n\nChallenge #1: 18 проверок First Name (в т.ч. обход maxlength и hidden admin).\n#2: обход HTML5 type=number.\n#4: валидные CNP (Румыния).\n#5: аналитика down.\n#6: невалидные границы даты такси 2017.\n#7: сценарий с обязательными словами.\n#8: аукцион / state transition.\n#9: страница кроссворда (JS).\n#10: создание пользователя и логин.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    folder('Challenge 1 — First Name (18 checks)', [
      req('00 GET form', 'GET', 'http://testingchallenges.thetestingmap.org/index.php'),
      req('01 empty', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('') }),
      req('02 spaces only', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('   ') }),
      req('03 valid name', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('Anna') }),
      req('04 one character', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('A') }),
      req('05 max 30 chars', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('A'.repeat(30)) }),
      req('06 over max 31 chars (bypass HTML maxlength)', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('A'.repeat(31)) }),
      req('07 digits only', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('12345') }),
      req('08 special characters', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('!@#$%^&*()') }),
      req('09 leading space', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1(' Anna') }),
      req('10 trailing space', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('Anna ') }),
      req('11 SQL quote', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1("O'Brien") }),
      req('12 XSS tag', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('<script>alert(1)</script>') }),
      req('13 unicode / accents', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('José') }),
      req('14 hyphenated', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('Mary-Jane') }),
      req('15 very long 200 chars', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('A'.repeat(200)) }),
      req('16 missing firstname field', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', {
        header: header(),
        body: urlencoded({ ...c1Hidden }),
      }),
      req('17 privilege hidden user_right_as_admin=1', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', {
        header: header(),
        body: c1('Anna', { user_right_as_admin: '1' }),
      }),
      req('18 newline / tab in name', 'POST', 'http://testingchallenges.thetestingmap.org/index.php', { header: header(), body: c1('Ann\na') }),
    ]),
    folder('Challenge 2 — bypass HTML5 number', [
      req('GET form', 'GET', 'http://testingchallenges.thetestingmap.org/challenge2.php'),
      req('valid integer', 'POST', 'http://testingchallenges.thetestingmap.org/challenge2.php', {
        header: header(),
        body: urlencoded({ valuesadded: '42', formSubmit: 'Submit' }),
      }),
      req('decimal 1.5', 'POST', 'http://testingchallenges.thetestingmap.org/challenge2.php', {
        header: header(),
        body: urlencoded({ valuesadded: '1.5', formSubmit: 'Submit' }),
      }),
      req('text abc', 'POST', 'http://testingchallenges.thetestingmap.org/challenge2.php', {
        header: header(),
        body: urlencoded({ valuesadded: 'abc', formSubmit: 'Submit' }),
      }),
      req('thousands separator 1,000', 'POST', 'http://testingchallenges.thetestingmap.org/challenge2.php', {
        header: header(),
        body: urlencoded({ valuesadded: '1,000', formSubmit: 'Submit' }),
      }),
      req('scientific 1e2', 'POST', 'http://testingchallenges.thetestingmap.org/challenge2.php', {
        header: header(),
        body: urlencoded({ valuesadded: '1e2', formSubmit: 'Submit' }),
      }),
      req('empty', 'POST', 'http://testingchallenges.thetestingmap.org/challenge2.php', {
        header: header(),
        body: urlencoded({ valuesadded: '', formSubmit: 'Submit' }),
      }),
    ]),
    folder('Challenge 4 — valid CNP (5 + invalid)', [
      req('GET form', 'GET', 'http://testingchallenges.thetestingmap.org/challenge4.php'),
      req('CNP male 1980', 'POST', 'http://testingchallenges.thetestingmap.org/challenge4.php', {
        header: header(),
        body: urlencoded({ CNP: '1800101010015', formSubmit: 'Check Validity' }),
      }),
      req('CNP female 1990', 'POST', 'http://testingchallenges.thetestingmap.org/challenge4.php', {
        header: header(),
        body: urlencoded({ CNP: '2900615401231', formSubmit: 'Check Validity' }),
      }),
      req('CNP male 2005', 'POST', 'http://testingchallenges.thetestingmap.org/challenge4.php', {
        header: header(),
        body: urlencoded({ CNP: '5051231529992', formSubmit: 'Check Validity' }),
      }),
      req('CNP foreign resident', 'POST', 'http://testingchallenges.thetestingmap.org/challenge4.php', {
        header: header(),
        body: urlencoded({ CNP: '7850320100101', formSubmit: 'Check Validity' }),
      }),
      req('CNP non-resident', 'POST', 'http://testingchallenges.thetestingmap.org/challenge4.php', {
        header: header(),
        body: urlencoded({ CNP: '9990707010077', formSubmit: 'Check Validity' }),
      }),
      req('CNP invalid checksum', 'POST', 'http://testingchallenges.thetestingmap.org/challenge4.php', {
        header: header(),
        body: urlencoded({ CNP: '1234567890123', formSubmit: 'Check Validity' }),
      }),
      req('CNP too short', 'POST', 'http://testingchallenges.thetestingmap.org/challenge4.php', {
        header: header(),
        body: urlencoded({ CNP: '123', formSubmit: 'Check Validity' }),
      }),
    ]),
    folder('Challenge 5 — analytics down', [
      req('GET challenge page', 'GET', 'http://testingchallenges.thetestingmap.org/challenge5.php'),
      req('analytics engine (may fail — that is the test)', 'GET', 'http://webanalyticsengine.thetestingmap.org/web_analytics_engine.php?country=Norway&email=me@whatyouknow.com&firstName=firstname&lastName=Gheorghe&formSubmit=Submit&ip=127.0.0.1&browser=Apiquick'),
      req('analytics with empty IP / browser', 'GET', 'http://webanalyticsengine.thetestingmap.org/web_analytics_engine.php?country=Norway&email=me@whatyouknow.com&firstName=Test&lastName=User&ip=&browser='),
    ]),
    folder('Challenge 6 — taxi datetime boundaries', [
      req('GET form', 'GET', 'http://testingchallenges.thetestingmap.org/challenge6.php'),
      req('year before 2017', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '31/12/2016 23:59', formSubmit: 'Submit' }),
      }),
      req('year after 2017', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '01/01/2018 00:00', formSubmit: 'Submit' }),
      }),
      req('less than 1 hour ahead', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '18/08/2017 12:20', formSubmit: 'Submit' }),
      }),
      req('29 Feb 2017 not leap', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '29/02/2017 14:00', formSubmit: 'Submit' }),
      }),
      req('31 April invalid day', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '31/04/2017 14:00', formSubmit: 'Submit' }),
      }),
      req('day 32', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '32/01/2017 14:00', formSubmit: 'Submit' }),
      }),
      req('day 00', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '00/01/2017 14:00', formSubmit: 'Submit' }),
      }),
      req('month 00', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '15/00/2017 14:00', formSubmit: 'Submit' }),
      }),
      req('month 13', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '15/13/2017 14:00', formSubmit: 'Submit' }),
      }),
      req('hour 24', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '18/08/2017 24:00', formSubmit: 'Submit' }),
      }),
      req('minute 60', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '18/08/2017 23:60', formSubmit: 'Submit' }),
      }),
      req('past date in 2017', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '01/01/2017 00:00', formSubmit: 'Submit' }),
      }),
      req('31 Feb', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '31/02/2017 14:00', formSubmit: 'Submit' }),
      }),
      req('US format MM/DD (unrecognized)', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '08/18/2017 14:00', formSubmit: 'Submit' }),
      }),
      req('ISO format (unrecognized)', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '2017-08-18 14:00', formSubmit: 'Submit' }),
      }),
      req('valid-looking +2h same day', 'POST', 'http://testingchallenges.thetestingmap.org/challenge6.php', {
        header: header(),
        body: urlencoded({ date_time: '18/08/2017 16:00', formSubmit: 'Submit' }),
      }),
    ]),
    folder('Challenge 7 — scenario words', [
      req('GET form', 'GET', 'http://testingchallenges.thetestingmap.org/challenge7.php'),
      req('missing required words', 'POST', 'http://testingchallenges.thetestingmap.org/challenge7.php', {
        header: header(),
        body: urlencoded({
          scenario: 'A tester opened a page and found a bug.',
          formSubmit: 'Submit',
        }),
      }),
      req('all required words', 'POST', 'http://testingchallenges.thetestingmap.org/challenge7.php', {
        header: header(),
        body: urlencoded({
          scenario:
            'At a testing conference a user reported a login failure. The team used data driven testing to replay the same steps with many accounts and improved error handling so the user saw a clear message instead of a blank page.',
          formSubmit: 'Submit',
        }),
      }),
    ]),
    folder('Challenge 8 — auction states', [
      req('GET board', 'GET', 'http://testingchallenges.thetestingmap.org/challenge8.php'),
      req('create saved (start in future)', 'POST', 'http://testingchallenges.thetestingmap.org/challenge8.php', {
        header: header(),
        body: urlencoded({
          selling: 'Vintage watch',
          start_date: '11:00',
          description: 'Working mechanical watch',
          end_date: '03:00',
          formSubmit: 'Send',
        }),
      }),
      req('create in progress (start already passed)', 'POST', 'http://testingchallenges.thetestingmap.org/challenge8.php', {
        header: header(),
        body: urlencoded({
          selling: 'Running auction',
          start_date: '09:00',
          description: 'Should be in progress at 10:15',
          end_date: '11:00',
          formSubmit: 'Send',
        }),
      }),
      req('create finished (end in past)', 'POST', 'http://testingchallenges.thetestingmap.org/challenge8.php', {
        header: header(),
        body: urlencoded({
          selling: 'Old lot',
          start_date: '08:00',
          description: 'Already ended',
          end_date: '09:00',
          formSubmit: 'Send',
        }),
      }),
      req('empty required fields', 'POST', 'http://testingchallenges.thetestingmap.org/challenge8.php', {
        header: header(),
        body: urlencoded({ selling: '', start_date: '', description: '', end_date: '', formSubmit: 'Send' }),
      }),
    ]),
    folder('Challenge 9 — crossword page', [
      req('GET crossword', 'GET', 'http://testingchallenges.thetestingmap.org/challenge9.php'),
    ]),
    folder('Challenge 10 — bug hunt login', [
      req('GET challenge page', 'GET', 'http://testingchallenges.thetestingmap.org/challenge10.php'),
      req('create user', 'POST', 'http://testingchallenges.thetestingmap.org/challenge10.php', {
        header: header(),
        body: urlencoded({
          username: 'driver1',
          password: 'Passw0rd!',
          firstname: 'Alex',
          lastname: 'Driver',
        }),
      }),
      req('create user empty password', 'POST', 'http://testingchallenges.thetestingmap.org/challenge10.php', {
        header: header(),
        body: urlencoded({ username: 'driver2', password: '', firstname: 'Sam', lastname: 'Lee' }),
      }),
      req('GET login app', 'GET', 'http://testingchallenges.thetestingmap.org/login/login.php'),
      req('GET bugs tracker', 'GET', 'http://bugs.brainforit.com/'),
      req('GET submit report page', 'GET', 'http://testingchallenges.thetestingmap.org/challenge10submitreport.php'),
    ]),
  ],
};

const apiquick = {
  info: {
    name: 'Apiquick — self-test',
    description:
      'Проверка Apiquick как в обычной работе: окружение «Apiquick Local» (Variables → Environments) с baseUrl, colId, reqId. Сверху выбери это окружение.\n\ncolId / reqId — id коллекции и запроса из ответа Create. После Create collection подставь id в переменную colId окружения (Edit), то же для reqId после Create request.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://127.0.0.1:8765' },
    { key: 'colId', value: '1' },
    { key: 'reqId', value: '1' },
  ],
  item: [
    folder('Smoke', [
      req('GET health', 'GET', '{{baseUrl}}/health', { event: statusOk }),
      req('GET collections', 'GET', '{{baseUrl}}/collections', { event: statusOk }),
      req('GET requests', 'GET', '{{baseUrl}}/requests', { event: statusOk }),
      req('GET environments', 'GET', '{{baseUrl}}/environments', { event: statusOk }),
      req('GET globals', 'GET', '{{baseUrl}}/globals', { event: statusOk }),
      req('GET cookies', 'GET', '{{baseUrl}}/cookies', { event: statusOk }),
      req('GET history', 'GET', '{{baseUrl}}/history', { event: statusOk }),
    ]),
    folder('CRUD collections & requests', [
      req('Create collection', 'POST', '{{baseUrl}}/collections', {
        header: header(true),
        body: rawJson({ name: 'Apiquick CRUD Temp', description: 'created by self-test collection' }),
        event: tests([
          'pm.test("created", function () {',
          '  pm.expect(pm.response.code).to.equal(200);',
          '});',
        ]),
      }),
      req('Rename collection', 'PUT', '{{baseUrl}}/collections/{{colId}}', {
        header: header(true),
        body: rawJson({ name: 'Apiquick CRUD Temp renamed' }),
      }),
      req('Duplicate collection', 'POST', '{{baseUrl}}/collections/{{colId}}/duplicate', { header: header(true) }),
      req('Export collection', 'GET', '{{baseUrl}}/collections/{{colId}}/export'),
      req('Create request in collection', 'POST', '{{baseUrl}}/requests', {
        header: header(true),
        body: rawJson({
          collection_id: '{{colId}}',
          name: 'Ping health',
          method: 'GET',
          url: 'http://127.0.0.1:8765/health',
          headers: [],
          params: [],
          body_type: 'none',
          body_content: '',
          body_raw_type: 'json',
        }),
      }),
      req('Get request by id', 'GET', '{{baseUrl}}/requests/{{reqId}}'),
      req('Update request', 'PUT', '{{baseUrl}}/requests/{{reqId}}', {
        header: header(true),
        body: rawJson({ name: 'Ping health updated', method: 'GET', url: 'http://127.0.0.1:8765/health' }),
      }),
      req('List requests in collection', 'GET', '{{baseUrl}}/requests/collection/{{colId}}'),
      req('Delete request', 'DELETE', '{{baseUrl}}/requests/{{reqId}}'),
      req('Delete collection', 'DELETE', '{{baseUrl}}/collections/{{colId}}'),
    ]),
    folder('Execute', [
      req('Execute GET health via executor', 'POST', '{{baseUrl}}/execute', {
        header: header(true),
        body: rawJson({
          name: 'executor ping',
          method: 'GET',
          url: 'http://127.0.0.1:8765/health',
          headers: [],
          params: [],
          body_type: 'none',
          body_content: '',
          auth_type: 'none',
          auth: {},
        }),
        event: tests([
          'pm.test("executor 200", function () {',
          '  pm.expect(pm.response.code).to.equal(200);',
          '});',
        ]),
      }),
      req('Execute missing URL (error in body, not popup)', 'POST', '{{baseUrl}}/execute', {
        header: header(true),
        body: rawJson({
          method: 'GET',
          url: 'http://127.0.0.1:1/',
          headers: [],
          params: [],
          body_type: 'none',
          auth_type: 'none',
          auth: {},
        }),
      }),
    ]),
    folder('Environments & globals', [
      req('Create environment', 'POST', '{{baseUrl}}/environments', {
        header: header(true),
        body: rawJson({
          name: 'Apiquick Local',
          variables: [
            { key: 'baseUrl', value: 'http://127.0.0.1:8765', enabled: true },
          ],
        }),
      }),
      req('Create global', 'POST', '{{baseUrl}}/globals', {
        header: header(true),
        body: rawJson({ key: 'selftest_marker', value: 'ok', secret: false }),
      }),
    ]),
  ],
};

function writeCollections() {
  if (!fs.existsSync(COL_DIR)) fs.mkdirSync(COL_DIR, { recursive: true });
  const a = path.join(COL_DIR, 'Testing Challenges.postman_collection.json');
  const b = path.join(COL_DIR, 'Apiquick Self-Test.postman_collection.json');
  fs.writeFileSync(a, JSON.stringify(challenges, null, 2));
  fs.writeFileSync(b, JSON.stringify(apiquick, null, 2));
  return [a, b];
}

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function upsertEnvironment(vars) {
  const envs = await json(await fetch(`${BASE}/environments`));
  const list = Array.isArray(envs) ? envs : [];
  const existing = list.find((e) => e.name === 'Apiquick Local');
  const payload = { name: 'Apiquick Local', variables: vars };
  if (existing) {
    const res = await fetch(`${BASE}/environments/${existing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('Updated environment Apiquick Local id=', existing.id, res.status);
    return existing.id;
  }
  const res = await fetch(`${BASE}/environments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const row = await json(res);
  console.log('Created environment Apiquick Local id=', row.id, res.status);
  return row.id;
}

async function upsertGlobal(key, value) {
  const rows = await json(await fetch(`${BASE}/globals`));
  const list = Array.isArray(rows) ? rows : [];
  const existing = list.find((g) => g.key === key);
  if (existing) {
    await fetch(`${BASE}/globals/${existing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, secret: false }),
    });
    console.log('Updated global', key);
    return;
  }
  await fetch(`${BASE}/globals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value, secret: false }),
  });
  console.log('Created global', key);
}

async function syncSelfTestVars(colId, reqId) {
  const vars = [
    { key: 'baseUrl', value: 'http://127.0.0.1:8765', enabled: true },
    { key: 'colId', value: String(colId || ''), enabled: true },
    { key: 'reqId', value: String(reqId || ''), enabled: true },
  ];
  await upsertEnvironment(vars);
  await upsertGlobal('baseUrl', 'http://127.0.0.1:8765');

  const cols = await json(await fetch(`${BASE}/collections`));
  const self = (Array.isArray(cols) ? cols : []).find((c) => c.name === 'Apiquick — self-test');
  if (self) {
    await fetch(`${BASE}/collections/${self.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: vars }),
    });
    console.log('Set collection variables on', self.name, 'id=', self.id);
  }
}

async function importAll(files) {
  const health = await fetch(`${BASE}/health`);
  if (!health.ok) throw new Error('Apiquick is not running on 8765');
  const existing = await json(await fetch(`${BASE}/collections`));
  const names = new Set((existing || []).map((c) => c.name));

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (names.has(data.info.name)) {
      console.log('Already present:', data.info.name);
      continue;
    }
    const res = await fetch(`${BASE}/collections/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.log('Import failed', file, res.status, text);
      continue;
    }
    const row = JSON.parse(text);
    console.log('Imported', row.name, 'id=', row.id);
  }

  const cols = await json(await fetch(`${BASE}/collections`));
  const self = (Array.isArray(cols) ? cols : []).find((c) => c.name === 'Apiquick — self-test');
  let reqId = '';
  if (self) {
    const reqs = await json(await fetch(`${BASE}/requests/collection/${self.id}`));
    if (Array.isArray(reqs) && reqs[0]) reqId = reqs[0].id;
    await syncSelfTestVars(self.id, reqId);
  } else {
    await syncSelfTestVars('', '');
  }
}

async function main() {
  const files = writeCollections();
  console.log('Wrote', files.join('\n'));
  if (process.argv.includes('--write-only')) return;
  try {
    await importAll(files);
  } catch (e) {
    console.log('Not imported into running app:', e.message);
    console.log('Start Apiquick and run: node scripts/seed-test-collections.js');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
