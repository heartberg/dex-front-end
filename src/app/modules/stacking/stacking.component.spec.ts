import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StackingComponent } from './stacking.component';

describe('StackingComponent', () => {
  let component: StackingComponent;
  let fixture: ComponentFixture<StackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StackingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
