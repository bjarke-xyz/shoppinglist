import { Injectable } from '@angular/core';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private _notification$ = new Subject<ToastPayload>();
  public notification$ = this._notification$.asObservable();

  constructor() {}

  public error(error: any): void {
    if (typeof error === 'string') {
      this._notification$.next({ message: error });
    } else {
      const errorMsg =
        error?.error?.error?.message ?? error?.message ?? 'An error occured';
      this._notification$.next({ message: errorMsg });
    }
  }
}

export interface ToastPayload {
  message: string;
  action?: string;
  config?: MatSnackBarConfig<any>;
}
