import {enableProdMode} from '@angular/core';
import {environment} from './environments/environment';
import {AppComponent} from './app/app.component';
import {bootstrapApplication, HAMMER_LOADER} from '@angular/platform-browser';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: HAMMER_LOADER,
      useValue: () => import('hammerjs')
    }
  ]
})
  .catch(err => console.error(err));
