import { parseAttributes, parseFd, simplifyFds, stringifyAttrs, stringifyFds, check2nf, check3nf, checkBcnf, findAttributeClosure, findCandidateKeys, findMinimalCover, decompositeTo3nf, checkNf } from './checker';


const [allAttributes, attrNames] = parseAttributes('A, B, C, D, E, G');
// console.log(attrNames);
const fds = parseFd('A->B\nB->C\nB->D\nB->E', attrNames, '\n');
// console.log(fds);
console.log(stringifyFds(fds, attrNames));
for (let i = 0; i <= allAttributes; i++) {
  const closure = findAttributeClosure(i, fds);
  console.log(`${stringifyAttrs(i, attrNames)}+`, '=', stringifyAttrs(closure, attrNames));
}
for (const ck of findCandidateKeys(allAttributes, simplifyFds(fds))) {
  console.log('ck', stringifyAttrs(ck, attrNames));
}
console.log('minimal cover:')
console.log(stringifyFds(findMinimalCover(fds), attrNames));

for (const isNf of checkNf(allAttributes, fds, attrNames)) {
  if (isNf.result) {
    console.log(`is ${isNf.type}`);
  } else {
    console.log(`NOT ${isNf.type}`);
    console.log(isNf.msg!);
  }
}


const dec = decompositeTo3nf(allAttributes, fds);
console.log('decompositioin to 3NF:', ...dec.map(a => stringifyAttrs(a, attrNames)));