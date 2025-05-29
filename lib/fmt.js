import { Counter } from "./collection.js";
export class Token {
    constructor(type = 'raw', content = '') {
        this.type = type;
        this.content = content;
    }

    eval() {
        return this.content;
    }

    toString() {
        return String(this.eval());
    }
}

export class VarToken extends Token {
    constructor(id, definition) {
        super('var', definition);
        this.id = id;
    }

    eval() {
        return `eval:${this.content}`;
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
            tokens.appendVar(cnt.add('id'),template.slice(startIndex, i));
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

export default {
    Token,
    VarToken,
    compile,
    render
};