import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  CanActivate,
  RouterStateSnapshot
} from '@angular/router';
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs/operators';

import { User } from '../models/model';

export interface AuthResponseData {
  player_id: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  registered?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements CanActivate {

  isLogin: boolean = false;

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient, private router: Router) { }

  loginBackend(playerID:string, password: string) {
    return this.http.post(
      environment.backendURL+'/login',
      {
        player_id: playerID,
        password: password
      },
      {observe:'response'}
    )
    .pipe (
      tap(resData=> {
        this.isLogin = true;
      })
    )
  }

  signUpBackend(formData: FormData){//playerID: string, password: string) {
    return this.http.post(
      environment.backendURL+'/signUp',
      formData,
      // {
      //   player_id: playerID,
      //   password: password
      // },
      {observe:'response'}
    )
  }

  canActivate(route:ActivatedRouteSnapshot, state:RouterStateSnapshot) {
    if(this.isLogin)
      return true;
    return this.router.parseUrl('/login');
  }

}
