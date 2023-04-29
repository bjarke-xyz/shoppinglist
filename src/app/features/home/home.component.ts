import { Component } from '@angular/core';
import { interval, map } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public readonly currentTime = interval(1000).pipe(map(() => new Date()));
}
