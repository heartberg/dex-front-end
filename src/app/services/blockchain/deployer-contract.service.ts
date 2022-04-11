import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ProjectViewModel } from 'src/app/shared/class/shared.class';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeployerContractService {

  private baseUrl = environment.baseUrl;

  constructor(private _http:HttpClient) { }

  
  postProjectViewModel(projectViewModel:ProjectViewModel){
    const url = `${this.baseUrl}/project/presale/create`;

    return this._http.post(url, projectViewModel);
  }

  postProjectViewModelWithoutPresaleData(projectViewModel:any){
    const url = `${this.baseUrl}/project/create`;

    return this._http.post(url, projectViewModel);
  }

  postProjectViewModelForMint(projectViewModel:any){
    const url = `${this.baseUrl}/project/mint`;

    return this._http.post(url, projectViewModel);
  }
}
