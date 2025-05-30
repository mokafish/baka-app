import { Buffer } from 'node:buffer';
import { Counter } from "./collection.js";
import { gen } from "./gen.js";

export class Token {
    constructor(group = 'raw', symbol = '') {
        this.group = group;
        this.symbol = symbol;
        this.pipes = [];
        this.value = '';
        this.eval = () => this.symbol
    }

    toString() {
        let x = this.eval();
        for (let pipe of this.pipes) {
            x = doPipe(pipe, x);

        }
        this.value = x;
        return x;
    }

    splitPipe(sep = '|') {
        if (this.symbol.includes(sep)) {
            this.pipes = this.symbol.split(sep).map(p => p.trim());
            this.symbol = this.pipes.shift();
        }
        return this;
    }

}

export class VarToken extends Token {
    constructor(symbol) {
        super('var', symbol);
        this.splitPipe();
        this.eval = gen(this.symbol);
    }
}

export class RefToken extends Token {
    constructor(symbol, context) {
        super('ref', symbol);
        this.splitPipe();
        this.context = context;
        this.eval = () => {
            if (this.context.table.has(this.symbol)) {
                return this.context.table.get(this.symbol).value;
            } else {
                throw new Error(`Reference "${this.symbol}" not found in context.`);
            }
        }
    }
}

export class AST {
    constructor() {
        this.table = new Map();
        this.cnt = new Counter();
        // Note: The following properties are commented out as they are not used in the current implementation.
        // this.list = [];
        // this.group_indexs = [];
        // this.var_indexs = [];
    }

    addToken(type, content) {
        switch (type) {
            case 'raw':
                this.table.set('raw:' + this.cnt.inc('raw'), new Token(type, content));
                break;
            case 'var':
                this.table.set('var:' + this.cnt.inc('var'), new VarToken(content));
                break;
            case 'ref':
                this.table.set('ref:' + this.cnt.inc('ref'), new RefToken(content, this));
                break;
            default:
                throw new Error(`Unknown token type: ${type}`);
        }
    }

    toString() {
        return Array.from(this.table.values()).join('');
    }
}

export function compile(template = '', brackets = ['{', '}']) {
    const ast = new AST();
    const [left, right] = brackets;

    let isInside = false;
    let i = 0;
    for (let j = 0; j < template.length; j++) {
        const char = template[j];
        if (!isInside && char === left) {
            // 遇到左括号，处理前面的原始内容
            if (j > i) {
                ast.addToken('raw', template.slice(i, j));
            }
            isInside = true;
            i = j + 1;
        } else if (isInside && char === right) {
            // 遇到右括号，处理表达式内容
            const expr = template.slice(i, j).trim();
            if (expr.startsWith('=')) {
                // 处理变量引用表达式
                ast.addToken('ref', 'var:' + expr.slice(1).trim());
            } else {
                // 处理变量定义表达式
                ast.addToken('var', expr);
            }

            isInside = false;
            i = j + 1;
        }
    }

    // 处理最后剩余的原始内容
    if (!isInside && i < template.length) {

        ast.addToken('raw', template.slice(i));
    }

    return ast
}

export function render(ast) {
    return ast.toString();
}

/**
 * 将数据转换为 Buffer
 * @param {number|string|Buffer} data - 要转换的数据
 * @returns {Buffer} - 转换后的 Buffer
 */
export function toBuffer(data) {
    let buf;
    if (typeof data === 'number') {
        if (Number.isInteger(data)) {
            buf = Buffer.allocUnsafe(4);
            buf.writeInt32BE(data);
        } else {
            buf = Buffer.allocUnsafe(8);
            buf.writeDoubleBE(data);
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
            buf = Buffer.from(buf.subarray(i));
        }
    } else if (typeof data === 'string') {
        buf = Buffer.from(data);
    }
    else if (Buffer.isBuffer(data)) {
        buf = data;
    } else {
        buf = Buffer.from(String(data));
    }
    return buf;
}

export function doPipe(name, data) {
    switch (name) {
        case 'str':
            return String(data);
        case 'url':
            return encodeURIComponent(String(data));
        case 'hex':
            return toBuffer(data).toString('hex');
        case 'HEX':
            return toBuffer(data).toString('hex').toUpperCase();
        case 'base64':
            return toBuffer(data).toString('base64');
        case 'base64url':
            return toBuffer(data).toString('base64url');
        default:
            throw new Error(`Unknown pipe function: ${name}`);
    }
}



export default {
    Token,
    VarToken,
    RefToken,
    AST,
    toBuffer,
    doPipe,
    compile,
    render
};