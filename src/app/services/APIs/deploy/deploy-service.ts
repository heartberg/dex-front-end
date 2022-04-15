import { Injectable } from '@angular/core';
import {environment} from "../../../../environments/environment";
import {
  projectMintModel,
  projectPresaleCreateModel,
  projectWithoutPresaleCreateModel
} from "../../../models/deployModel";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class deployService {
  private baseUrl = environment.baseUrl;

  constructor(private _http: HttpClient) { }

  ProjectPresaleCreate(project: projectPresaleCreateModel): Observable<projectPresaleCreateModel>{
    const url = `${this.baseUrl}/project/presale/create`;
    return this._http.post<projectPresaleCreateModel>(url, project);
  }

  ProjectCreate(project:projectWithoutPresaleCreateModel): Observable<projectWithoutPresaleCreateModel>{
    const url = `${this.baseUrl}/project/create`;
    return this._http.post<projectWithoutPresaleCreateModel>(url, project);
  }

  projectMint(project:projectMintModel): Observable<projectMintModel>{
    const url = `${this.baseUrl}/project/mint`;
    return this._http.post<projectMintModel>(url, project);
  }

  projectburnOptIn(projectId: any): Observable<any>{
    const url = `${this.baseUrl}/project/burnOptIn`;
    return this._http.post<any>(url, projectId);
  }

  projectSetup(projectId: any): Observable<any>{
    const url = `${this.baseUrl}/project/setup`;
    return this._http.post<any>(url, projectId);
  }

}
