import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NouvelleCampagne } from './nouvelle-campagne';

describe('NouvelleCampagne', () => {
  let component: NouvelleCampagne;
  let fixture: ComponentFixture<NouvelleCampagne>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NouvelleCampagne],
    }).compileComponents();

    fixture = TestBed.createComponent(NouvelleCampagne);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
