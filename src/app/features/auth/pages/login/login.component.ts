import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/service/auth.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  public email = '';
  public password = '';
  constructor(
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toast: ToastService
  ) {}

  public async login(): Promise<void> {
    const defaultUrl = '/app';
    const returnUrl =
      this.activatedRoute.snapshot.queryParamMap.get('return') ?? defaultUrl;
    this.authService.login(this.email, this.password).subscribe({
      next: async (resp) => {
        try {
          console.log(resp);
          await this.router.navigateByUrl(returnUrl);
        } catch (error) {
          console.error(`Failed to navigate to ${returnUrl}`, error);
          await this.router.navigateByUrl(defaultUrl);
        }
      },
      error: (error) => {
        console.log(error);
        this.toast.error(error);
      },
    });
  }
}
