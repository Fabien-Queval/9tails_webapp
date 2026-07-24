import { TestBed } from '@angular/core/testing';

import { Jeu } from './jeu';

describe('Jeu', () => {
  let service: Jeu;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Jeu);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
