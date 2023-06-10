import { Component, effect } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastService } from './shared/services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    private toastService: ToastService,
    private snackbar: MatSnackBar
  ) {
    effect(() => {
      const toasts = this.toastService.notifications();
      // console.log('toasts effect', toasts.length);
      while (toasts.length > 0) {
        const toast = toasts.pop();
        if (toast) {
          this.snackbar.open(toast.message, toast.action, toast.config);
        }
      }
    });
  }
}
