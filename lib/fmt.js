import { Buffer } from 'node:buffer';
import { Counter } from "./collection.js";
import { gen } from "./gen.js";

export class Token {
    constructor(type = 'raw', content = '') {
        this.type = type;
        this.content = content;
        this.eval = () => this.content;
    }

    toString() {
        return this.content;
    }
}

export class VarToken extends Token {
    constructor(id, definition) {
        super('var', definition);
        this.id = id;
        let parts = definition.split('|')
        this.expr = parts[0].trim();
        this.encoding = parts[1] ? parts[1].trim() : '';
        this.eval = gen(this.expr);
    }

    toString() {
        let value = this.eval();
        if (this.encoding) {
            return encoding(value, this.encoding);
        }

        return String(value);
    }
}

class TokenList extends Array {
    constructor(...args) {
        super(...args);
    }

    appendRaw(content) {
        this.push(new Token('raw', content));
    }

    appendVar(id, content) {
        this.push(new VarToken(id, content));
    }

    toString() {
        return render(this);
    }
}


export function compile(template, brackets = ['{', '}']) {
    const tokens = new TokenList();
    const cnt = new Counter();
    const [left, right] = brackets;
    let startIndex = 0;
    let isInside = false;

    for (let i = 0; i < template.length; i++) {
        const char = template[i];
        if (!isInside && char === left) {
            // 遇到左括号，处理前面的原始内容
            if (i > startIndex) {
                tokens.appendRaw(template.slice(startIndex, i));
            }
            isInside = true;
            startIndex = i + 1;
        } else if (isInside && char === right) {
            // 遇到右括号，处理表达式内容
            tokens.appendVar(cnt.add('id'), template.slice(startIndex, i));
            isInside = false;
            startIndex = i + 1;
        }
    }

    // 处理最后剩余的原始内容
    if (!isInside && startIndex < template.length) {

        tokens.appendRaw(template.slice(startIndex));
    }

    return tokens;
}

export function render(tokens) {
    return tokens.join('');
}

/**
 * 
 * @param {number|string|Buffer} value 
 * @param {'hex'|'HEX'|'base64'} encoding 
 * @returns 
 */
export function encoding(value, encoding) {
    let buf = value;
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            buf = Buffer.allocUnsafe(4);
            buf.writeInt32BE(value);
        } else {
            buf = Buffer.allocUnsafe(8);
            buf.writeDoubleBE(value);
        }
        // 去除前导零
        let i = 0;
        while (i < buf.length && buf[i] === 0) {
            i++;
        }
        if (i === buf.length) {
            // 全零，保留一个字节
            buf = Buffer.from([0]);
        } else {
            buf = buf.slice(i);
        }
    } else if (typeof value === 'string') {
        buf = Buffer.from(value);
    }
    else if (Buffer.isBuffer(value)) {
        buf = value;
    } else {
        throw new TypeError('Value must be a number, string or Buffer');
    }

    switch (encoding) {
        case 'hex':
            return buf.toString('hex');
        case 'HEX':
            return buf.toString('hex').toUpperCase();
        case 'base64':
            return buf.toString('base64');
        case 'base64url':
            return buf.toString('base64url');
        case 'base32':
            return buf.toString('base32');
        case 'BASE32':
            return buf.toString('base32').toUpperCase();
        default:
            return encodeURIComponent(buf.toString('utf8'));
    }
}

export default {
    Token,
    VarToken,
    compile,
    render
};