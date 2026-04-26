export function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

export function fromRoman(s: string): number {
  const vals: Record<string, number> = { I:1,V:5,X:10,L:50,C:100,D:500,M:1000 };
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = vals[s[i]] ?? 0;
    const nxt = vals[s[i+1]] ?? 0;
    n += cur < nxt ? -cur : cur;
  }
  return n;
}
