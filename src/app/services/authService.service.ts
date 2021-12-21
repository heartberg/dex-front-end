import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {User} from "../models/user.model";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.baseUrl;
  constructor(private _http: HttpClient) {
  }

  createUser(input: any): Observable<any> {
    const url = `${this.baseUrl}/user/create`;
    return this._http.post<any>(url, input)
  }

  getUserByWallet(wallet: string | any): Observable<User> {
    const url = `${this.baseUrl}/user/get/byWallet`;
    return this._http.get<User>(url, {
      params: {
        wallet: wallet
      }
    })
  }
}
