import { BrowserModule } from '@angular/platform-browser';
import { Injector, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MainComponent } from './components/main.component';
import { LoginComponent } from './components/login.component';
import { SignUpComponent } from './components/sign-up.component';
import { PlayComponent } from './components/play.component';
import { RankingsComponent } from './components/rankings.component';
import { AppRoutingModule } from './app-routing.module';
import { OptionsComponent } from './components/options.component';
import { GameService } from './services/game.service';
import { Globals } from './models/model';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    LoginComponent,
    SignUpComponent,
    PlayComponent,
    OptionsComponent,
    RankingsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [ GameService ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(injector: Injector) {
    Globals.injector = injector
  }
 }
