import { Component } from '@angular/core';
import { Attributes, CheckNfResult } from 'relational checker core/types';
import { RelationalCheckerService } from './relational-checker.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'database-relational-helper';
  constructor(private rcs: RelationalCheckerService) { }
  parseDone = false;
  errorMsg = '';
  attrstr = '';
  fdsstr = '';
  buttonNames = [
    'Find Closure',
    'Find Candidate Keys',
    'Find Minimal Cover',
    'Check Normal Forms',
    'Decomposite to 3NF',
  ];
  displayArea = 0;
  singleAttrs: {
    name: string,
    attr: Attributes,
  }[] = [];
  selectedAttrs: Attributes = 0;

  textAreaHeight(): number {
    const minHeight = 4;
    const lines = this.fdsstr.split('\n').length + 1;
    return Math.max(minHeight, lines);
  }
  parse(): void {
    this.selectedAttrs = 0;
    if (this.rcs.parse(this.attrstr, this.fdsstr)) {
      this.singleAttrs = this.rcs.singleAttrs();
      this.parseDone = true;
    } else {
      this.errorMsg = this.rcs.errorMsg;
      this.parseDone = false;
    }
  }
  selectAttr(attr: Attributes): void {
    this.selectedAttrs = this.rcs.selectAttr(attr, this.selectedAttrs);
  }
  isSelected(attr: Attributes): boolean {
    return !!(attr & this.selectedAttrs);
  }
  findClosure(): string {
    return `${this.rcs.stringifyAttrs(this.selectedAttrs)}+ = ${this.rcs.stringifyAttrs(this.rcs.findClosure(this.selectedAttrs))}`;
  }
  findCandidateKeys(): string[] {
    return this.rcs.findCandidateKeys().map(a => this.rcs.stringifyAttrs(a));
  }
  findMinimalCover(): string[] {
    return this.rcs.stringifyFds(this.rcs.findMinimalCover()).split('\n');
  }
  checkNormalForms(): CheckNfResult[] {
    return this.rcs.checkNf();
  }
  decompositeTo3Nf(): string[] {
    return this.rcs.decompositeTo3nf().map(a => this.rcs.stringifyAttrs(a));
  }
}
