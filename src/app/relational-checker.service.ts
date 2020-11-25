import { Injectable } from '@angular/core';
import { Attributes, AttrNames, CheckNfResult, FD } from 'relational checker core/types';
import {
  checkNf,
  decompositeTo3nf,
  findAttributeClosure,
  findCandidateKeys,
  findMinimalCover,
  parseAttributes,
  parseFd,
  stringifyAttrs,
  stringifyFds
} from 'relational checker core/relationalChecker';

@Injectable({
  providedIn: 'root'
})
export class RelationalCheckerService {
  allAttrs: Attributes = 0;
  attrNames: AttrNames = [];
  fds: FD[] = [];
  errorMsg = '';

  constructor() { }

  /**
   * parse attributes and FDs, return true unless error
   * @param attrstr inputted string for attibutes
   * @param fdsstr inputted string for functional dependencies
   */
  parse(attrstr: string, fdsstr: string): boolean {
    this.allAttrs = 0;
    this.attrNames = [];
    this.fds = [];
    this.errorMsg = '';
    try {
      [this.allAttrs, this.attrNames] = parseAttributes(attrstr);
      this.fds = parseFd(fdsstr, this.attrNames);
      return true;
    } catch (e) {
      this.errorMsg = (e as Error).message;
      return false;
    }
  }
  stringifyAttrs(attrs: Attributes = this.allAttrs): string {
    return stringifyAttrs(attrs, this.attrNames);
  }
  stringifyFds(fds: FD[] = this.fds): string {
    return stringifyFds(fds, this.attrNames);
  }

  findClosure(attrs: Attributes = this.allAttrs): Attributes {
    return findAttributeClosure(attrs, this.fds);
  }

  findCandidateKeys(): Attributes[] {
    return findCandidateKeys(this.allAttrs, this.fds);
  }

  findMinimalCover(): FD[] {
    return findMinimalCover(this.fds);
  }

  checkNf(): CheckNfResult[] {
    return checkNf(this.allAttrs, this.fds, this.attrNames);
  }

  decompositeTo3nf(): Attributes[] {
    return decompositeTo3nf(this.allAttrs, this.fds);
  }
}
