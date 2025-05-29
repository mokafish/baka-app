import { parseRange } from "./util.js";
/**
 * 
 * @param {string} rule 
 * @returns {function}
 */
export function gen(rule) {
    if (rule === '') {
        return () => '';
    }
    else if (rule.includes(',')) {
        const values = rule.split(',').map(v => v.trim());
        return genEnum(values);
    } else if (rule.includes('-')) {
        const [min, max] = parseRange(rule, '-');
        return genRandom(min, max);
    } else if (rule.includes(':')) {
        const [min, max] = parseRange(rule, ':');
        return genCyclic(min, max);
    } else {
        return () => `{{${rule}}}`;
    }
}

export function genRandom(min, max) {
    return () => Math.floor(Math.random() * (max - min + 1)) + min;
}

export function genCyclic(min, max) {
    let current = min;
    return () => {
        const value = current;
        current += 1;
        if (current > max) current = min;
        return value;
    };
}

export function genEnum(values) {
    return () => values[Math.floor(Math.random() * values.length)];
}
