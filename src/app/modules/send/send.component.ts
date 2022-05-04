import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {AssetReqService} from "../../services/APIs/assets-req.service";
import {AssetViewModel} from "../../models/assetView.model";

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss'],
})
export class SendComponent implements OnInit {
  addressNotOptedIn: boolean = false;
  invalidAddress: boolean = false;
  assetArr: AssetViewModel[] = [];
  wallet = localStorage.getItem('wallet')
  sendForm = this.fb.group({
    sendInput: [],
    addressInput: [],
  });

  onSubmit() {
    console.log(this.sendForm.value);
    this.sendForm.reset();
  }

  constructor(private fb: FormBuilder, private req: AssetReqService) {}

  ngOnInit(): void {
    this.req.getAssetPairs(false, '', this.wallet!).subscribe((res) => {
      this.assetArr.push(...res);
    });
  }

  handleCheckboxUpdateSecond(event: boolean) {
    if (event === true) {
      this.req.getAssetPairs(true, '', this.wallet!).subscribe(async (res) => {
        this.assetArr.push(...res);
      });
    } else if (event === false) {
      this.req.getAssetPairs(false, '', this.wallet!).subscribe((res) => {
        // TODO uncomment for prod
        this.assetArr.push(...res);
      });
    }
  }

  getValueFromDropDown(event: string, number: number) {
    console.log(event);
  }
}
