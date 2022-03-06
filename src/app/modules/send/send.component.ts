import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss'],
})
export class SendComponent implements OnInit {
  addressNotOptedIn: boolean = false;
  invalidAddress: boolean = false;

  sendForm = this.fb.group({
    sendInput: [],
    addressInput: [],
  });

  onSubmit() {
    console.log(this.sendForm.value);
    this.sendForm.reset();
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {}
}
