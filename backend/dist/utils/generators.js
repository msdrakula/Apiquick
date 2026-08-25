"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBuiltinVariables = generateBuiltinVariables;
exports.newGuid = newGuid;
const crypto_1 = __importDefault(require("crypto"));
const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington'];
const COUNTRIES = ['United States', 'China', 'Japan', 'Germany', 'India', 'United Kingdom', 'France', 'Brazil', 'Italy', 'Canada', 'Russia', 'South Korea', 'Australia', 'Spain', 'Mexico', 'Indonesia', 'Netherlands', 'Saudi Arabia', 'Turkey', 'Switzerland'];
const COMPANIES = ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp', 'Hooli', 'Vehement Capital Partners', 'Massive Dynamic', 'Wayne Enterprises', 'Stark Industries', 'Cyberdyne Systems', 'Gekko & Co', 'Wonka Industries', 'LexCorp', 'Olivia Pope & Associates'];
const JOB_TITLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'DevOps Engineer', 'QA Engineer', 'CTO', 'CEO', 'CFO', 'HR Manager', 'Sales Manager', 'Marketing Director', 'System Administrator', 'Business Analyst', 'Project Manager'];
const STREETS = ['Main St', 'Broadway', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Washington Ave', 'Lake Shore Dr', 'Park Blvd', 'Riverside Dr', 'Sunset Blvd', 'Market St', 'Mission St', 'Fillmore St'];
const WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'];
const NOUNS = ['cat', 'dog', 'house', 'car', 'tree', 'book', 'phone', 'computer', 'chair', 'table', 'window', 'door', 'pen', 'paper', 'bag'];
const VERBS = ['run', 'walk', 'jump', 'swim', 'read', 'write', 'think', 'speak', 'listen', 'watch', 'create', 'build', 'design', 'develop', 'test'];
const ING_VERBS = ['running', 'walking', 'jumping', 'swimming', 'reading', 'writing', 'thinking', 'speaking', 'listening', 'watching', 'creating', 'building', 'designing', 'developing', 'testing'];
const PHRASES = ['To be or not to be', 'The quick brown fox', 'Hello world', 'Think different', 'Just do it', 'Keep it simple', 'Move fast and break things', 'Done is better than perfect', 'Stay hungry stay foolish', 'The best way to predict the future is to invent it'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Customer Support', 'Legal', 'IT', 'R&D'];
const FILE_EXTS = ['pdf', 'jpg', 'png', 'docx', 'xlsx', 'txt', 'zip', 'mp4', 'html', 'json'];
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip', 'video/mp4', 'text/html', 'application/json'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'RUB', 'CNY', 'CAD', 'AUD', 'CHF', 'SEK'];
const TIMEZONES = ['UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET', 'IST', 'JST', 'AEST'];
const COLORS = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray'];
const BANK_NAMES = ['Sberbank', 'Tinkoff', 'VTB', 'Alfa-Bank', 'Raiffeisen', 'Gazprombank', 'Sovcombank', 'Promsvyazbank', 'Rosbank', 'UniCredit Bank'];
const TRANSACTION_TYPES = ['debit', 'credit', 'transfer', 'withdrawal', 'deposit', 'payment', 'refund', 'fee', 'interest', 'dividend'];
const PRODUCT_NAMES = ['Widget', 'Gadget', 'Tool', 'Device', 'App', 'Service', 'Solution', 'Platform', 'System', 'Framework'];
const ABBREVIATIONS = ['CEO', 'CFO', 'CTO', 'COO', 'CMO', 'VP', 'HR', 'IT', 'R&D', 'QA'];
const MIME_TYPES = ['application/json', 'text/html', 'image/png', 'application/pdf', 'text/plain', 'image/jpeg', 'application/xml', 'text/css', 'application/javascript', 'multipart/form-data'];
const LOCALES = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'ru-RU'];
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randHex(len) { return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join(''); }
function randDigits(len) { return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).toString().replace(/,/g, ''); }
function generateBuiltinVariables() {
    const d = new Date();
    return {
        '$timestamp': String(Math.floor(d.getTime() / 1000)),
        '$isoTimestamp': d.toISOString(),
        '$randomInt': String(rand(0, 1000)),
        '$randomFloat': String(Math.random()),
        '$randomBoolean': String(Math.random() > 0.5),
        '$randomHexColor': `#${randHex(6)}`,
        '$randomEmail': `user${rand(1, 99999)}@example.com`,
        '$randomExampleEmail': `user${rand(1, 99999)}@example.com`,
        '$randomUserAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '$randomPassword': randHex(12),
        '$randomFirstName': pick(FIRST_NAMES),
        '$randomLastName': pick(LAST_NAMES),
        '$randomFullName': `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        '$randomPhoneNumber': `+7 (${rand(900, 999)}) ${rand(100, 999)}-${rand(10, 99)}-${rand(10, 99)}`,
        '$randomCity': pick(CITIES),
        '$randomStreetAddress': `${rand(1, 9999)} ${pick(STREETS)}`,
        '$randomCountry': pick(COUNTRIES),
        '$randomJobTitle': pick(JOB_TITLES),
        '$randomCompanyName': pick(COMPANIES),
        '$randomUrl': `https://example.com/page/${rand(1, 999)}`,
        '$randomDomainName': `example${rand(1, 999)}.com`,
        '$randomCurrency': pick(CURRENCIES),
        '$randomWord': pick(WORDS),
        '$randomAvatarImage': `https://i.pravatar.cc/150?img=${rand(1, 70)}`,
        '$randomBankAccount': `40817810${randDigits(12)}`,
        '$randomTransactionType': pick(TRANSACTION_TYPES),
        '$randomPrice': String((Math.random() * 1000).toFixed(2)),
        '$randomProductName': `${pick(PRODUCT_NAMES)} ${rand(100, 999)}`,
        '$randomProductId': `SKU-${rand(10000, 99999)}`,
        '$randomAbbreviation': pick(ABBREVIATIONS),
        '$randomColor': pick(COLORS),
        '$randomCommonFileExt': pick(FILE_EXTS),
        '$randomCommonFileName': `document${rand(1, 999)}.${pick(FILE_EXTS)}`,
        '$randomCommonFileType': pick(FILE_TYPES),
        '$randomDepartment': pick(DEPARTMENTS),
        '$randomNoun': pick(NOUNS),
        '$randomVerb': pick(VERBS),
        '$randomIngVerb': pick(ING_VERBS),
        '$randomPhrase': pick(PHRASES),
        '$randomLocale': pick(LOCALES),
        '$randomMimeType': pick(MIME_TYPES),
        '$randomNumber': String(rand(0, 10000)),
        '$randomNumeric': randDigits(10),
        '$randomSemver': `${rand(0, 9)}.${rand(0, 9)}.${rand(0, 9)}`,
        '$randomString': randHex(16),
        '$randomTimeZone': pick(TIMEZONES),
        '$randomBitcoin': `1${randHex(33)}`,
        '$randomBSN': `${randDigits(9)}`,
        '$randomBankAccountBic': `SABR${randHex(2).toUpperCase()}MM`,
        '$randomBankAccountName': pick(BANK_NAMES),
    };
}
function newGuid() {
    return crypto_1.default.randomUUID();
}
//# sourceMappingURL=generators.js.map