import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyDeploysComponent } from './my-deploys.component';

describe('MyDeploysComponent', () => {
  let component: MyDeploysComponent;
  let fixture: ComponentFixture<MyDeploysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyDeploysComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyDeploysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
