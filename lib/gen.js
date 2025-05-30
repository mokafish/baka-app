import { parseRange } from "./util.js";

export const charTable = {
    s: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    l: 'abcdefghijklmnopqrstuvwxyz',
    w: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    h: '0123456789abcdefghijklmnopqrstuvwxyz',
    H: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    d: '0123456789'
};


/**
 * 
 * @param {string} rule 
    number:
        X-Y   ramdom integer
        X:Y   cycle increment integer
        -- example: 1-100, 10:20, 1-, 1:, :20
    timestamp:
        ts   integer of seconds
        tm   decimal of seconds.millisecond
        ms   integer of millisecond
        -- example: ts, tm, ms
    string:
        <t>X-Y  ramdom length string
        <t>X:Y  cycle increment length string
        -- char table: s [A-Za-z0-9]; u [A-Z]; l [a-z];
            w [A-Za-z]; h [0-9a-z]; H [0-9A-Z]; d [0-9]; 
        -- example: s5-10, w3:8, h4:12, H6:20
    other:  
        uuid  uuid4() 8-4-4-4-12 format string
        A,B,C,...  random enumeration value
        *file      random enumeration value from file
        #cmd       execute shell command and return the output
        =N         reference to the Nth value in the current context
    - Rule abbr. (number/string) -
        X-  => X-2147483647
        Y   => 0-Y
        X:  => X:2147483647
        :Y  => 0:Y 
 * @returns {function}
 */
export default function gen(rule) {
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

export function genStringRandom(type, min, max) {
    const pool = charTable[type];
    const it_length = genRandom(min, max);
    const it_index = genRandom(0, pool.length - 1);
    return () => {
        const length = it_length();
        const arr = new Array(length);
        for (let i = 0; i < length; i++) {
            arr[i] = pool[it_index()];
        }
        return arr.join('');
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


export function* product(...iterables) {
  // 处理空输入
  if (iterables.length === 0) {
    yield [];
    return;
  }

  // 将可迭代对象转为数组（保存元素）
  const pools = iterables.map(iter => [...iter]);
  const n = pools.length;
  const indices = new Array(n).fill(0);
  
  while (true) {
    // 产出当前组合
    yield indices.map((idx, i) => pools[i][idx]);
    
    // 进位算法：从右向左寻找可递增的位置
    let pos = n - 1;
    while (pos >= 0) {
      if (indices[pos] < pools[pos].length - 1) {
        indices[pos]++;
        break;
      }
      indices[pos] = 0;  // 重置当前位置
      pos--;             // 向左进位
    }
    
    // 全部组合已枚举完毕
    if (pos < 0) return;
  }
}