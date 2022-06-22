import {Component, DoCheck, ElementRef, OnInit, ViewChild} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { platform_settings as ps } from 'src/app/blockchain/platform-conf';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation } from 'src/app/blockchain/platform-conf';
import { ProjectPreviewModel } from 'src/app/models/projectPreviewModel';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { VerseApp } from 'src/app/blockchain/verse_application';
import { AssetViewModel } from 'src/app/models/assetViewModel';
import {AssetReqService} from "../../services/APIs/assets-req.service";
import {ScrollService} from "../../services/scroll.service";

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class TokensComponent implements OnInit, DoCheck {



  arr: [ProjectPreviewModel, BlockchainInformation?][] = [];

  public isActiveFirst: boolean = false;
  public isActiveSecond: boolean = false;

  searchInput = this.fb.control([]);
  @ViewChild('height', {static: false})
  public height: ElementRef;

  constructor(
    private projectsReqService: projectReqService,
    private fb: FormBuilder,
    private deployedApp: DeployedApp,
    private verseApp: VerseApp,
    private assetReqService: AssetReqService,
    private scrollService: ScrollService
  ) {
  }

  ngDoCheck() {
    // const el = document.getElementById('s')
    // document.addEventListener('scroll', () => {
    //   console.log(el!.getBoundingClientRect())
    // })
  }

  ngOnInit(): void {

    setTimeout(() => {
      console.log(this.height, 'ssss')
      this.scrollService.height = this.height;
      this.scrollService.currentSection.subscribe(
        (res) => {
          console.log("current section: ", res)
        }
      )
    }, 500)
    this.projectsReqService.getAllProjects('a-z', 1).subscribe(
      (res) => {
        this.arr = []
        res.forEach(async element => {
          if(element.asset.assetId == ps.platform.verse_asset_id) {
            // let bcInfo = await this.verseApp.getBlockchainInformation();
            // @ts-ignore
            this.arr.push([element, 's'])
          } else if(element.asset.smartProperties){
            // let bcInfo = await this.deployedApp.getBlockchainInformation(element.asset.smartProperties!.contractId)
            // @ts-ignore
            this.arr.push([element, 's'])
          } else {
            this.arr.push([element, undefined])
          }
        });
        console.log(this.arr);
      }
    )
    let arr = [...this.arr];
    for (let i = 0; i > 10; i++) {
      // @ts-ignore
      this.arr.push(arr);
    }
    console.log(this.arr);
    this.isActiveFirst = true;
  }

  activeFirst() {
    this.isActiveFirst = true;
    this.isActiveSecond = false;
  }

  activeSecond() {
    this.isActiveSecond = true;
    this.isActiveFirst = false;
  }

  copyContentToClipboard(content: HTMLElement) {
    navigator.clipboard.writeText(content.innerText);
  }

  pow(decimals: number){
    return Math.pow(10, decimals)
  }

  getPrice(item: [ProjectPreviewModel, BlockchainInformation?]) {
    let diff = 0
    let price = item[1]!.algoLiquidity / item[1]!.tokenLiquidity
    if(item[0].asset.decimals > 6) {
      diff = item[0].asset.decimals - 6
      price = price * Math.pow(10, diff)

    } else if(item[0].asset.decimals < 6) {
      diff = 6 - item[0].asset.decimals
      price = price / Math.pow(10, diff)
    }
    return price
  }

  search($event: Event) {
    let wallet = localStorage.getItem('wallet');
    this.assetReqService.getAssetPairs(true, this.searchInput.value, wallet!).subscribe((item: AssetViewModel[]) => {
      return item;
    })
  }

  getScroll() {

  }
}
