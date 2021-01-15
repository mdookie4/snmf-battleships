import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthResponseData, AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {
  @ViewChild('imageFile') imageFile: ElementRef;

  fileToUpload: File=null;

  error: string = null;

  imagePath = '/assets/spritesheets/defaultCaptain.png'

  signUpForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authSvc: AuthService,
    private sanitizer: DomSanitizer,
    private http: HttpClient) { }

  ngOnInit(): void {
    this.signUpForm = this.fb.group({
      avatarImg: this.fb.control(''),
      playerID: this.fb.control('', Validators.required),
      password: this.fb.control('', Validators.required)
    })
  }

  handleFileInput(files: FileList) {
    //console.info(files);
    this.fileToUpload = files.item(0);
  }

  async onRegister() {
    if(!this.signUpForm.valid) {
      return;
    }
    if(this.fileToUpload == null) {
      this.fileToUpload = new Blob([""],{type:'blob'}) as File;
    }
    const formData = new FormData();
    //formData.set('upload', this.imageFile.nativeElement.files[0]);
    //formData.append('image', this.fileToUpload, this.fileToUpload.name);
    formData.set('image', this.fileToUpload as Blob);

    const player_id = this.signUpForm.value.playerID;
    const password = this.signUpForm.value.password;

    formData.set('player_id', player_id);
    formData.set('password', password);

    let authObs: Observable<any>;//<AuthResponseData>;

    //const result
    authObs = await this.authSvc.signUpBackend(formData);//player_id, password);
    //console.info(result);
    authObs.subscribe(
      resData => {
        console.info("sign up success");
        console.log(resData);
        this.router.navigate(['/login']);
      },
      errorMessage => {
        console.log(errorMessage.error.message);
        this.error = errorMessage.error.message;
      }
    )

    this.signUpForm.reset();

  }

}
