import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Quemsomos } from './quemsomos';

describe('Quemsomos', () => {
  let component: Quemsomos;
  let fixture: ComponentFixture<Quemsomos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Quemsomos],
    }).compileComponents();

    fixture = TestBed.createComponent(Quemsomos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
