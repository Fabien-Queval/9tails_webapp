import { TestBed } from '@angular/core/testing';

import { Campagne } from './campagne';

describe('Campagne', () => {
  let service: Campagne;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Campagne);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
