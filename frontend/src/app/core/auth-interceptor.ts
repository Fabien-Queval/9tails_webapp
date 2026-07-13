import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from './auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);            // On réclame le service
  const jwt = auth.getToken();      // On lui demande le JWT

  // Pas de JWT (déconnecté, ou la requête de login elle-même) → on laisse filer telle quelle
  if (!jwt) {
    return next(req);
  }

  // JWT présent→ on clone en ajoutant l'en-tête Bearer
  const reqAvecJwt = req.clone({
    setHeaders: { Authorization: 'Bearer ' + jwt },
  });

  return next(reqAvecJwt);
}


