import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AssetViewModel } from 'src/app/models/assetView.model';
import { TokenEntryViewModel } from 'src/app/models/tokenEntryViewModel';
import { TokenError } from '@angular/compiler/src/ml_parser/lexer';

@Injectable({
  providedIn: 'root',
})
export class AssetReqService {
  private baseUrl = environment.baseUrl;

  constructor(private _http: HttpClient) {}

  getAssetPairs(
    all: boolean = false,
    search: string = '',
    wallet: string = ''
  ) {
    const url = `${this.baseUrl}/asset/get/pairs`;
    return this._http.get<AssetViewModel[]>(url, {
      params: {
        wallet: wallet,
        search: search,
        all: all,
      },
    });
  }

  getAverageEntries(wallet: string, assetId: number){
    const url = `${this.baseUrl}/asset/get/entries/avg`;
    return this._http.get<TokenEntryViewModel[]>(url, {
      params: {
        wallet: wallet,
        assetId: +assetId
      }
    });
  }

  getAllEntriesForWallet(wallet: string, assetId: number){
    const url = `${this.baseUrl}/asset/get/entries/all/wallet`;
    return this._http.get<TokenEntryViewModel[]>(url, {
      params: {
        wallet: wallet,
        assetId: +assetId
      }
    });
  }

  getAllEntries(assetId: number){
    const url = `${this.baseUrl}/asset/get/entries/all`;
    return this._http.get<TokenEntryViewModel[]>(url, {
      params: {
        assetId: +assetId
      }
    });
  }

  postBuy(buy: TokenEntryViewModel){
    const url = `${this.baseUrl}/asset/buy`;
    return this._http.post<TokenEntryViewModel>(url, buy);
  }

  postSell(sell: TokenEntryViewModel){
    const url = `${this.baseUrl}/asset/sell`;
    return this._http.post<TokenEntryViewModel>(url, sell);
  }

  getAssetFavorites(wallet: string | any) {
    const url = `${this.baseUrl}/asset/get/favorites`;
    return this._http.get<AssetViewModel[]>(url, {
      params: {
        wallet: wallet,
      },
    });
  }

  addFavoriteAsset(assetId: number, wallet: string) {
    const url = `${this.baseUrl}/asset/favorites/add`;
    return this._http.post(url, {
      params: {
        assetId: +assetId,
        wallet: wallet,
      },
    },
      {
        params: {
          assetId: +assetId,
          wallet: wallet,
        },
      }
    );
    // const headers = { 'content-type': 'application/json'};
    // const bodyOne = +assetId;
    // const bodyTwo = wallet;
    // const body = {
    //   assetId: +bodyOne,
    //   wallet: bodyTwo,
    // }
    // return this._http.post(url, body, {'headers': headers})
  }

  removeFavoriteAsset(assetId: number, wallet: string) {
    const url = `${this.baseUrl}/asset/favorites/remove`;
    return this._http.get(url, {
      params: {
        assetId: assetId,
        wallet: wallet,
      },
    });
  }

  removeMaxBuy(assetId: number) {
    const url = `${this.baseUrl}/asset/remove/maxBuy`;
    return this._http.post(url, {
      params: {
        assetId: assetId,
      },
    });
  }
}

//   getUserByWallet(wallet: string | any): Observable<User> {
//     const url = `${this.baseUrl}/user/get/byWallet`;
//     return this._http.get<User>(url, {
//       params: {
//         wallet: wallet
//       }
//     })
//   }
