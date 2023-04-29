import { Injectable, inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

export const authGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (await authService.isLoggedIn()) {
    return true;
  }

  const currentPath = window.location.pathname;
  return router.parseUrl(`/auth/login?return=${currentPath}`);
};
