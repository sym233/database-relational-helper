import {
  parseAttributes,
  parseFd,
  stringifyAttrs,
  stringifyFds,
  findAttributeClosure,
  findCandidateKeys,
  findMinimalCover,
  decompositeTo3nf,
  checkNf
} from './relationalChecker';

// input
const attrstr = 'A, B, C, D, E, G';
const fdstr = `A->B
B->C
B->D
B->E`;


const [allAttributes, attrNames] = parseAttributes(attrstr);
// console.log(attrNames);
const fds = parseFd(fdstr, attrNames);
// console.log(fds);
console.log(stringifyFds(fds, attrNames));
for (let i = 0; i <= allAttributes; i++) {
  const closure = findAttributeClosure(i, fds);
  console.log(`${stringifyAttrs(i, attrNames)}+`, '=', stringifyAttrs(closure, attrNames));
}
for (const ck of findCandidateKeys(allAttributes, fds)) {
  console.log('ck', stringifyAttrs(ck, attrNames));
}
console.log('minimal cover:');
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
