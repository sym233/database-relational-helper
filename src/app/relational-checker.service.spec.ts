import { TestBed } from '@angular/core/testing';

import { RelationalCheckerService } from './relational-checker.service';

describe('RelationalCheckerService', () => {
  let service: RelationalCheckerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelationalCheckerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
