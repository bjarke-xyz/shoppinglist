import { Injectable, inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // if (authService.isLoggedIn) {
  //   return true;
  // }

  // Redirect to the login page
  return router.parseUrl('/auth/login');
};
