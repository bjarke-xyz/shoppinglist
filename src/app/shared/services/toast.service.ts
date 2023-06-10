import { Injectable, signal } from '@angular/core';
import { MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  public notifications = signal<ToastPayload[]>([]);

  constructor() {}

  public error(error: any): void {
    const defaultConfig: MatSnackBarConfig = {
      duration: 3000,
      panelClass: ['mat-toolbar', 'mat-warn'],
    };
    console.error(error);
    if (typeof error === 'string') {
      this.notifications.mutate((toasts) => {
        toasts.push({
          message: error,
          config: defaultConfig,
        });
      });
    } else {
      if (error?.error?.error?.name === 'ZodError') {
        const issues = error.error.error.issues as { message: string }[];
        const issuesStr = issues.map((x) => x.message).join('\n');
        this.notifications.mutate((toasts) => {
          toasts.push({
            message: issuesStr,
            config: defaultConfig,
          });
        });
      } else {
        const errorMsg =
          error?.error?.error?.message ??
          error?.error?.error ??
          error?.error ??
          error?.message ??
          'An error occured';
        this.notifications.mutate((toasts) => {
          toasts.push({
            message: errorMsg,
            config: defaultConfig,
          });
        });
      }
    }
  }

  public info(text: string, duration = 3000): void {
    const defaultConfig: MatSnackBarConfig = {
      duration: duration,
      panelClass: ['mat-toolbar', 'mat-primary'],
    };
    this.notifications.mutate((toasts) => {
      toasts.push({
        message: text,
        config: defaultConfig,
      });
    });
  }
}

export interface ToastPayload {
  message: string;
  action?: string;
  config?: MatSnackBarConfig<any>;
}
