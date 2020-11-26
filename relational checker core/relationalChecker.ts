import { Queue } from './utils';
import { Attributes, AttrNames, FD, CheckNfResult } from './types';

const MAX_ATTRS = 30;

/**
 * extract attribute names from string, return the whole bitwise attributes and their names
 * @param attrstr "attr 1, attr 2,..."
 * @param seperator default ','
 */
function parseAttributes(attrstr: string, seperator: string = ','): [Attributes, AttrNames] {
  const splitted = attrstr.split(seperator).map(s => s.trim());
  const set = new Set<string>();
  for (const attr of splitted) {
    if (set.has(attr)) {
      throw new Error(`Attributes Parsing Error: duplicate attribute '${attr}'`);
    }
    set.add(attr);
  }
  if (splitted.length > MAX_ATTRS) {
    throw new Error(`Attributes Parsing Error: too many attributes (${splitted.length}), at most ${MAX_ATTRS} is supported`);
  }
  return [(1 << splitted.length) - 1, splitted];
}

/**
 * parse functional dependencies from string
 * @param fds "A, B -> C, D\n", a FD per line
 * @param attrNames attribute names
 * @param fdSeperator seperate each FD, default '\n'
 * @param attrSeperator seperate each attr, default ','
 */
function parseFd(fds: string, attrNames: AttrNames, fdSeperator: string = '\n', attrSeperator: string = ','): FD[] {
  const lines = fds.split(fdSeperator).map(line => line.trim()).filter(line => line.length > 0);
  const attrIndexes = new Map<string, number>();
  for (const [index, attrName] of attrNames.entries()) {
    attrIndexes.set(attrName, index);
  }
  const getIndex = (attrstr: string, line: string) =>
    attrstr
      .split(attrSeperator)
      .map(attr => attr.trim())
      .map(attr => {
        if (attrIndexes.has(attr)) {
          return 1 << attrIndexes.get(attr)!;
        }
        throw new Error(`FD Parsing Error: unknown attribute '${attr}' in ${line}`);
      })
      .reduce((a, b) => a + b);
  return lines.map(line => {
    const [left, right] = line.split('->');
    if (!left || !right) {
      throw new Error(`FD Parsing Error: cannot parse FD '${line}'`);
    }
    return {
      lhs: getIndex(left, line),
      rhs: getIndex(right, line),
    };
  });
}

/**
 * convert attributes to thier names for display
 * @param attrs bitwise attribute
 * @param attrNames attribute names
 */
function stringifyAttrs(attrs: Attributes, attrNames: AttrNames): string {
  const names: string[] = [];
  for (let i = 0; i < attrNames.length; i++) {
    if (attrs & 1 << i) {
      names.push(attrNames[i]);
    }
  }
  return `{${names.join(', ')}}`;
}

/**
 * to string, for display
 * @param fds functional dependencies
 * @param attrNames attribute names
 * @param splitter split each fd string, default '\n'
 */
function stringifyFds(fds: FD[], attrNames: AttrNames, splitter: string = '\n'): string {
  return fds
    .map(fd => `${stringifyAttrs(fd.lhs, attrNames)} -> ${stringifyAttrs(fd.rhs, attrNames)}`)
    .join(splitter);
}

/**
 * simplify fds
 * @param fds functional dependencies
 */
function simplifyFds(fds: FD[]): FD[] {
  const sfds: FD[] = [];
  for (const fd of fds) {
    for (const a of singleAttrs(fd.rhs)) {
      sfds.push({
        lhs: fd.lhs,
        rhs: a,
      });
    }
  }
  return sfds;
}

function isSubsetOf(subAttrs: Attributes, attrs: Attributes): boolean {
  return (subAttrs | attrs) === attrs;
}


/**
 * return an array of attibutes sa[] that for i !== j,
 * sa[i] in attrs,
 * sa[i] only has one bit 1
 * (sa[i] & sa[j]) === 0,
 * | sa[..] = attrs
 * @param attrs attributes
 */
function singleAttrs(attrs: Attributes): Attributes[] {
  const sAttrs: Attributes[] = [];
  for (let a = 1; a <= attrs; a <<= 1) {
    if (isSubsetOf(a, attrs)) {
      sAttrs.push(a);
    }
  }
  return sAttrs;
}

function isTriviaFd(fd: FD): boolean {
  return isSubsetOf(fd.lhs, fd.rhs);
}

/**
 * find attribute closures regarding given attributes
 * @param attrs attributes that needed to find closures
 * @param fds functional dependencies
 */
function findAttributeClosure(attrs: Attributes, fds: FD[]): Attributes {
  const closures: Map<number, Attributes> = new Map();
  for (let i = 0; i < MAX_ATTRS; i++) {
    const mask = (1 << (i + 1)) - 1; // (i + 1) binary ones
    if (mask >> 1 > attrs) {
      break;
    }
    const currentAttrs: Attributes = attrs & mask;
    let currentClosure: Attributes = currentAttrs | (closures.get(currentAttrs & (mask >> 1)) ?? 0);
    for (; ;) {
      let attrAdded = false;
      for (const fd of fds) {
        if (isSubsetOf(fd.lhs, currentClosure) && !isSubsetOf(fd.rhs, currentClosure)) {
          // lhs is included in currentclosure && rhs has attrs not in current closure
          attrAdded = true;
          currentClosure |= fd.rhs;
        }
      }
      if (!attrAdded) {
        closures.set(currentAttrs, currentClosure);
        break;
      }
    }
  }
  return closures.get(attrs) ?? 0;
}

/**
 * find all candidate keys
 * @param attrs attributes to find candidate keys, usually the entire attributes
 * @param fds functional dependencies
 */
function findCandidateKeys(attrs: Attributes, fds: FD[]): Attributes[] {
  const sfds = simplifyFds(fds);
  const q: Queue<Attributes> = new Queue([attrs]);
  const s: Set<Attributes> = new Set();
  while (q.length) {
    const attr = q.dequeue()!;
    let hasRemoved = false;
    for (const sfd of sfds) {
      if (isSubsetOf(sfd.lhs, attr) && isSubsetOf(sfd.rhs, attr) && !isSubsetOf(sfd.rhs, sfd.lhs)) {
        // lhs in attrs && rhs in attrs && rhs not in lhs
        hasRemoved = true;
        const newAttr = attr - sfd.rhs;
        q.enqueue(newAttr);
      }
    }
    if (!hasRemoved) {
      // no more attrs to be removed
      let subsetOf: Attributes = 0;
      let isSuperSet = false;
      for (const a of s) {
        if (isSubsetOf(a, attr)) {
          isSuperSet = true;
          break;
        }
        if (isSubsetOf(attr, a)) {
          subsetOf = a;
          break;
        }
      }
      if (!isSuperSet) {
        if (subsetOf) {
          s.delete(subsetOf);
        }
        s.add(attr);
      }
    }
  }
  return [...s];
}

/**
 * find a minimal cover
 * TODO: find all minimal covers
 * @param fds functional dependencies
 */
function findMinimalCover(fds: FD[]): FD[] {
  const sfds = simplifyFds(fds);
  // reduce left
  const reducdFds: FD[] = [];
  for (const sfd of sfds) {
    let hasRemoved = false;
    for (let a = 1; a <= sfd.lhs; a <<= 1) {
      if (isSubsetOf(a, sfd.lhs)) {
        if (isSubsetOf(sfd.rhs, findAttributeClosure(sfd.lhs - a, fds))) {
          hasRemoved = true;
          reducdFds.push({
            lhs: sfd.lhs - a,
            rhs: sfd.rhs,
          });
        }
      }
    }
    if (!hasRemoved) {
      reducdFds.push(sfd);
    }
  }

  const minimalCover: FD[] = [];
  // remove redundancy
  for (let i = 0; i < reducdFds.length; i++) {
    const currFd = reducdFds[i];
    const otherFds = reducdFds.slice(i + 1).concat(minimalCover).filter(ofd => ofd !== currFd);
    if (!isSubsetOf(currFd.rhs, findAttributeClosure(currFd.lhs, otherFds))) {
      minimalCover.push(currFd);
    }
  }
  return minimalCover;
}


/**
 * check if in 2NF
 * @param attrs attributes
 * @param fds functional dependencies
 * @param attrNames attribute names, for error messages
 */
function check2nf(attrs: Attributes, fds: FD[], attrNames: AttrNames): CheckNfResult {
  const candidateKey = findCandidateKeys(attrs, fds)[0];
  for (const sa of singleAttrs(candidateKey)) {
    const otherAttrs = candidateKey - sa;
    const cls = findAttributeClosure(otherAttrs, fds);
    if (cls !== otherAttrs) {
      return {
        type: '2NF',
        result: false,
        msg: `non-prime attributes ${stringifyAttrs(cls - otherAttrs, attrNames)} can be inferred by ${stringifyAttrs(otherAttrs, attrNames)} instead of ${stringifyAttrs(candidateKey, attrNames)}`,
      };
    }
  }
  return {
    type: '2NF',
    result: true,
  };
}

/**
 * check if in 3NF
 * @param attrs attributes
 * @param fds functional dependencies
 * @param attrNames attribute names, for error messages
 */
function check3nf(attrs: Attributes, fds: FD[], attrNames: AttrNames): CheckNfResult {
  const candidateKeys = findCandidateKeys(attrs, fds);
  for (const fd of fds) {
    if (!isTriviaFd(fd)) {
      if (!candidateKeys.some(ck => isSubsetOf(ck, fd.lhs)) && !candidateKeys.some(ck => isSubsetOf(fd.rhs, ck))) {
        return {
          type: '3NF',
          result: false,
          msg: `in non-trivial FD ${stringifyFds([fd], attrNames)}, ${stringifyAttrs(fd.lhs, attrNames)} is not superkey and ${stringifyAttrs(fd.rhs, attrNames)} is not prime attribute(s)`,
        };
      }
    }
  }
  return {
    type: '3NF',
    result: true,
  };
}

function checkBcnf(attrs: Attributes, fds: FD[], attrNames: AttrNames): CheckNfResult {
  for (const fd of fds) {
    if (!isTriviaFd(fd)) {
      if (findCandidateKeys(attrs, fds).every(ck => !isSubsetOf(ck, fd.lhs))) {
        // lhs is not super key
        return {
          type: 'BCNF',
          result: false,
          msg: `in non-trivial FD ${stringifyFds([fd], attrNames)}, ${stringifyAttrs(fd.lhs, attrNames)} is not superkey`,
        };
      }
    }
  }
  return {
    type: 'BCNF',
    result: true,
  };
}

/**
 * check 2NF, 3NF and BCNF
 */
function checkNf(attrs: Attributes, fds: FD[], attrNames: AttrNames): CheckNfResult[] {
  return [
    check2nf(attrs, fds, attrNames),
    check3nf(attrs, fds, attrNames),
    checkBcnf(attrs, fds, attrNames),
  ];
}

/**
 * find a solution to losslessly decomposite to 3NF
 * @param attrs attributes
 * @param fds functional dependencies
 */
function decompositeTo3nf(attrs: Attributes, fds: FD[]): Attributes[] {
  const minimalCover = findMinimalCover(fds);
  const candidateKey = findCandidateKeys(attrs, fds)[0];
  const m: Map<Attributes, Attributes> = new Map();
  for (const fd of minimalCover) {
    if (m.has(fd.lhs)) {
      m.set(fd.lhs, m.get(fd.lhs)! | fd.rhs);
    } else {
      m.set(fd.lhs, fd.lhs | fd.rhs);
    }
  }
  const decomposition: Attributes[] = [...new Set(m.values())];
  if (!decomposition.some(a => isSubsetOf(candidateKey, a))) {
    // does not include a superkey
    decomposition.push(candidateKey);
  }
  return decomposition;
}

export {
  parseAttributes,
  parseFd,
  isSubsetOf,
  // simplifyFds,
  singleAttrs,
  stringifyAttrs,
  stringifyFds,
  findAttributeClosure,
  findCandidateKeys,
  findMinimalCover,
  check2nf, check3nf, checkBcnf,
  checkNf,
  decompositeTo3nf,
};
