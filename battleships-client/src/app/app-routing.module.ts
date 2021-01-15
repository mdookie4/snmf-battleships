import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { MainComponent } from './components/main.component';
import { PlayComponent } from './components/play.component';
import { RankingsComponent } from './components/rankings.component';
import { SignUpComponent } from './components/sign-up.component';
import { AuthService } from './services/auth.service';


const appRoutes: Routes = [
  { path: '', component: MainComponent},
  { path: 'login', component: LoginComponent},
  { path: 'signUp', component: SignUpComponent},
  {
    path: 'play', component: PlayComponent,
    //canActivate: [AuthService]
    data: {},
    runGuardsAndResolvers: 'always'
  },
  {
    path: 'rankings', component: RankingsComponent
    //canActivate: [AuthService]
  },
  { path:'**', redirectTo: '/', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes,{
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})

export class AppRoutingModule {}
