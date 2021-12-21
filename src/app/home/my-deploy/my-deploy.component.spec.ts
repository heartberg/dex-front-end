import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyDeployComponent } from './my-deploy.component';

describe('MyDeployComponent', () => {
  let component: MyDeployComponent;
  let fixture: ComponentFixture<MyDeployComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyDeployComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyDeployComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
