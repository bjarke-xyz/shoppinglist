import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
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
  form: FormGroup = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
    password2: new FormControl(''),
  });
  register = false;
  constructor(
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toast: ToastService
  ) {}

  public async submit(): Promise<void> {
    if (!this.form.valid) {
      return;
    }
    if (this.register) {
      if (this.form.value.password !== this.form.value.password2) {
        this.toast.error('Passwords must match');
        return;
      }
    }
    const defaultUrl = '/app';
    const returnUrl =
      this.activatedRoute.snapshot.queryParamMap.get('return') ?? defaultUrl;

    const obs = this.register
      ? this.authService.register(
          this.form.value.email,
          this.form.value.password
        )
      : this.authService.login(this.form.value.email, this.form.value.password);

    obs.subscribe({
      next: async (resp) => {
        try {
          console.log(resp);
          if (this.register) {
            this.toast.info(
              `A confirmation email has been sent to ${this.form.value.email}`,
              10000
            );
          }
          await this.router.navigateByUrl(returnUrl);
        } catch (error) {
          console.error(`Failed to navigate to ${returnUrl}`, error);
          await this.router.navigateByUrl(defaultUrl);
        }
      },
      error: (error) => {
        this.toast.error(error);
      },
    });
  }

  public toggleRegister(register: boolean): void {
    this.register = register;
  }
}
