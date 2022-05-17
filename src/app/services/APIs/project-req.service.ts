import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { OrderingEnum } from 'src/app/models/orderingEnum.enum';
import { ProjectViewModel } from 'src/app/models/projectView.model';
import { Observable, Subject } from 'rxjs';
import { PresaleEntryModel } from 'src/app/models/presaleEntryModel';

@Injectable({
  providedIn: 'root',
})
export class projectReqService {
  private baseUrl = environment.baseUrl;
  private wallet = localStorage.getItem('wallet');

  presaleCount = new Subject<number>();

  constructor(private _http: HttpClient) {}

  getCreatedPresales(wallet: string | any, page: number) {
    const url = `${this.baseUrl}/project/presale/get/created/`;
    return this._http.get<ProjectPreviewModel[]>(url, {
      params: {
        wallet: wallet,
        page: page,
      },
    });
  }

  getCreatedProjects(wallet: string | any, page: number) {
    const url = `${this.baseUrl}/project/get/created/`;
    return this._http.get<ProjectPreviewModel[]>(url, {
      params: {
        wallet: wallet,
        page: page,
      },
    });
  }

  getParticipatedPresales(wallet: string | any, page: number): Observable<ProjectPreviewModel[]> {
    const url = `${this.baseUrl}/project/presale/get/participated/`;
    return this._http.get<ProjectPreviewModel[]>(url, {
      params: {
        wallet: wallet,
        page: page,
      },
    });
  }

  // /project/presale/get/all/
  getAllPresales(ordering: OrderingEnum, page: number, search: string = '') {
    const url = `${this.baseUrl}/project/presale/get/all/`;
    return this._http.get<ProjectPreviewModel[]>(url, {
      params: {
        ordering: ordering,
        page: page,
        search: search,
      },
    });
  }

  getAllProjects(ordering: string | null = null, page: number = 1) {
    const url = `${this.baseUrl}/project/get/all`;

    return this._http.get<ProjectPreviewModel[]>(url, {
      params: {
        ordering: ordering!,
        page: page,
      },
    });
  }

  getProjectById(id: string) {
    const url = `${this.baseUrl}/project/get/byId`;

    return this._http.get<ProjectViewModel>(url, {
      params: {
        id: id,
      },
    });
  }

  getProjectWithpresaleById(id: string) {
    const url = `${this.baseUrl}/project/presale/get/byId`;

    return this._http.get<ProjectViewModel>(url, {
      params: {
        projectId: id,
      },
    });
  }

  fairLaunch(projectModel: ProjectViewModel) {
    const url = `${this.baseUrl}/project/presale/toFairLaunch`;

    return this._http.post(url, {
      params: {
        projectModel: projectModel,
      },
    });
  }

  reSetupPresale(projectModel: ProjectViewModel) {
    const url = `${this.baseUrl}/project/presale/resetup`;

    return this._http.post(url, {
      params: {
        projectModel: projectModel,
      },
    });
  }

  createPresaleEntry(entryModel: PresaleEntryModel) {
    const url = `${this.baseUrl}/entry/create`;
    return this._http.post(url, entryModel);
  }

}

// getAssetPairs(
//     all: boolean = true,
//     search: string = '',
//     wallet: string = ''
// ) {
//     const url = `${this.baseUrl}/asset/get/pairs`;
//     return this._http.get<AssetView[]>(url, {
//         params: {
//             wallet: wallet,
//             search: search,
//             all: all
//         }
//     })
// }
