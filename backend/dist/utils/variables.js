"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceVariables = replaceVariables;
exports.buildVariables = buildVariables;
exports.getPredefinedVariables = getPredefinedVariables;
exports.makeExecuteCounters = makeExecuteCounters;
const generators_1 = require("./generators");
const counters_1 = require("./counters");
function replaceVariables(text, variables, counters) {
    if (!text)
        return text;
    let result = text;
    result = result.replace(/\{\{\$(guid|uuid|randomUUID)\}\}/gi, () => (0, generators_1.newGuid)());
    result = result.replace(/\{\{\$counter(?::([A-Za-z0-9_.-]+))?\}\}/g, (_m, name) => {
        return (counters || (0, counters_1.makeCounterCtx)(false)).value(name || 'default');
    });
    for (const [key, value] of Object.entries(variables)) {
        if (!key)
            continue;
        result = result.split(`{{${key}}}`).join(String(value));
    }
    return result;
}
function buildVariables(envId, envs) {
    const vars = {};
    if (!envId)
        return vars;
    const env = envs.find((e) => e.id === envId);
    if (env && env.variables) {
        for (const v of env.variables) {
            if (v.enabled !== false)
                vars[v.key] = v.value;
        }
    }
    return vars;
}
function getPredefinedVariables() {
    return (0, generators_1.generateBuiltinVariables)();
}
function makeExecuteCounters(increment) {
    return (0, counters_1.makeCounterCtx)(increment);
}
//# sourceMappingURL=variables.js.map