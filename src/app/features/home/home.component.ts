import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, timer } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public readonly currentTime: Observable<Date> = new BehaviorSubject(
    new Date()
  );
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.currentTime = timer(0, 1000).pipe(map(() => new Date()));
    }
  }

  public goToApp() {
    this.router.navigateByUrl('/app');
  }
}
