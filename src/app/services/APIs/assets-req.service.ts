import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { AssetView } from "src/app/models/assetView.model";

@Injectable({
    providedIn: 'root'
})
export class AssetReqService {
    private baseUrl = environment.baseUrl;

    constructor(
        private _http: HttpClient
    ) { }

    getAssetPairs(
        all: boolean = true,
        search: string = '',
        wallet: string = ''
    ) {
        const url = `${this.baseUrl}/asset/get/pairs`;
        return this._http.get<AssetView[]>(url, {
            params: {
                wallet: wallet,
                search: search,
                all: all
            }
        })
    }

    addFavoriteAsset(
        assetId: number,
        wallet: string
    ) {
        const url = `${this.baseUrl}/asset/favorites/add`;
        return this._http.get(url, {
            params: {
                assetId: assetId,
                wallet: wallet
            }
        })
    }

    removeFavoriteAsset(
        assetId: number,
        wallet: string
    ) {
        const url = `${this.baseUrl}/asset/favorites/remove`;
        return this._http.get(url, {
            params: {
                assetId: assetId,
                wallet: wallet
            }
        })
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