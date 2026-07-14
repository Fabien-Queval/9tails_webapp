import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Jeu } from './jeu';

describe('Jeu', () => {
  let component: Jeu;
  let fixture: ComponentFixture<Jeu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Jeu],
    }).compileComponents();

    fixture = TestBed.createComponent(Jeu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
