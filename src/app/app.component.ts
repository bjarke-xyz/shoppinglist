import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastService } from './shared/services/toast.service';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly destroy = new Subject<void>();
  constructor(
    private toastService: ToastService,
    private snackbar: MatSnackBar
  ) {}
  ngOnInit(): void {
    this.toastService.notification$
      .pipe(takeUntil(this.destroy))
      .subscribe(({ message, action, config }) => {
        this.snackbar.open(message, action, config);
      });
  }
  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}
