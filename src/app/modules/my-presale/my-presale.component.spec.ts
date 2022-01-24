import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPresaleComponent } from './my-presale.component';

describe('MyPresaleComponent', () => {
  let component: MyPresaleComponent;
  let fixture: ComponentFixture<MyPresaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyPresaleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyPresaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
