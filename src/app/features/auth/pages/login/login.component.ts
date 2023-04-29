import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  constructor(public authService: AuthService, private router: Router) {}

  public login(): void {
    this.authService.login('klmasdl', 'yo').subscribe(() => {
      this.router.navigateByUrl('/app');
    });
  }
}
