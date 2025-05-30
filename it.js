// () => {
//     let d = new Date();
//     return () => {
//         let s = d.toISOString().substring(0, 10)
//         d.setTime(d.getTime() + 86400000);
//         return s;
//     }
// }

function genAny() {
    let d = new Date();
    return () => {
        let s = d.toISOString().substring(0, 10)
        d.setTime(d.getTime() + 86400000);
        return s;
    }
}

genAny; // eval result

// EOF

console.log('hello, world!');
