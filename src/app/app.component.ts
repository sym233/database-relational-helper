import { Component } from '@angular/core';
import { stringifyAttrs } from 'relational checker core/relationalChecker';
import { RelationalCheckerService } from './relational-checker.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'database-relational-helper';
  constructor(private relationalCheckService: RelationalCheckerService) { }
  parsedRes = '';
  attrstr = '';
  fdsstr = '';
  buttonNames = [
    'Find Closure',
    'Find Candidate Keys',
    'Find Minimal Cover',
    'Check Normal Forms',
    'Decomposite to 3NF',
  ];
  textAreaHeight(): number {
    const minHeight = 4;
    const lines = this.fdsstr.split('\n').length + 1;
    return Math.max(minHeight, lines);
  }
  parse(): void {
    if (this.relationalCheckService.parse(this.attrstr, this.fdsstr)) {
      console.log('parsed');
      this.parsedRes = `Attributes:
${this.relationalCheckService.stringifyAttrs()}
Functional Dependencies:
${this.relationalCheckService.stringifyFds()}`;
    } else {
      this.parsedRes = this.relationalCheckService.errorMsg;
    }
  }
}
