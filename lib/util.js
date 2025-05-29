export function parseRange(expression, separator = '-', min = 0, max = 2147483647) {
    const parts = expression.split(separator).slice(0, 2);
    let sa, sb;

    if (parts.length === 1) {
        // 无分隔符，整个作为结束部分
        sa = '';
        sb = parts[0];
    } else {
        sa = parts[0];
        sb = parts[1];
    }

    // 解析数值并处理无效输入
    let a = parseFloat(sa.trim(), 10);
    let b = parseFloat(sb.trim(), 10);

    if (isNaN(a)) a = min;
    if (isNaN(b)) b = max;


    // 确保范围有效性
    if (a > b) {
        [a, b] = [b, a];
    }

    return [a, b];
}