import { Component, inject, DestroyRef, signal, effect } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  private readonly eventSource = new EventSource(
    `${environment.apiUrl}/api/events/events`,
    {
      withCredentials: true,
    }
  );
  public events = signal<string[]>([]);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.eventSource.close();
    });
    this.eventSource.addEventListener('message', (event) => {
      console.log(event);
      this.events.mutate((events) => {
        events.push(event.data);
      });
    });
    this.eventSource.addEventListener('error', (event) => {
      console.error(event);
    });
  }
}
