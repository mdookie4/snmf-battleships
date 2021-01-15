import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthResponseData, AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  error: string = null;

  loginForm: FormGroup;

  constructor(private authSvc: AuthService, private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      playerID: this.fb.control('', Validators.required),
      password: this.fb.control('', Validators.required)
    })
  }

  async onLogin(){
    if(!this.loginForm.valid) {
      return;
    }
    const player_id = this.loginForm.value.playerID;
    const password = this.loginForm.value.password;

    //console.log(player_id + " " + password);

    let authObs: Observable<any>;//<AuthResponseData>;

    //const result
    authObs = await this.authSvc.loginBackend(player_id, password);
    //console.info(result);
    authObs.subscribe(
      resData => {
        console.log(resData);
        this.router.navigate(['/play'],{queryParams:{player:player_id}});
      },
      errorMessage => {
        console.log(errorMessage.error.message);
        this.error = errorMessage.error.message;
      }
    )

    this.loginForm.reset();
  }

}
