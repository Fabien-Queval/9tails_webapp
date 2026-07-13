import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })                 // service dispo partout dans l'app
export class Auth {
  private http = inject(HttpClient);                // le messager qui parle au backend

  // --- Le JWT côté navigateur -------------------------------------------------
  // 1) L'ÉTIQUETTE du tiroir : le nom sous lequel on range le JWT dans localStorage.
  private readonly CLE_JWT = 'jwt';

  // 2) LE SIGNAL : la mémoire "vivante" (RAM) du JWT. Au démarrage, on la remplit
  //    UNE seule fois avec ce qui dort déjà dans le tiroir (ou null si déconnecté).
  private jwtSignal = signal<string | null>(localStorage.getItem(this.CLE_JWT));

  // Dérivé tout seul : "connecté" = il y a un JWT dans le signal.
  isLoggedIn = computed(() => this.jwtSignal() !== null);

  // Appel réseau. ⚠️ Le backend répond { token: "..." } : "token" est SON nom de
  // champ (contrat backend), rien à voir avec notre stockage local.
  login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      'http://localhost:3000/api/auth/login',       // l'URL cible
      { email, password },                          // le body envoyé
    );
  }

  register(email: string,pseudo: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      'http://localhost:3000/api/auth/register',
      { email, pseudo, password },
    )
  }

  // Range le JWT reçu à deux endroits, chacun son rôle.
  saveToken(nouveauJwt: string): void {
    localStorage.setItem(this.CLE_JWT, nouveauJwt); // (1) tiroir/disque — survit au F5
    this.jwtSignal.set(nouveauJwt);                 // (2) signal/RAM — l'app réagit aussitôt
  }

  // Suppression du JWT pour logout
  logout(): void {
    localStorage.removeItem(this.CLE_JWT);          // On retire du tiroir/disque
    this.jwtSignal.set(null);                 // On vide le signal/RAM → isLoggedIn() repasse à false
  }

  // Lu par l'intercepteur HTTP Bearer quand il aura besoin du JWT.
  getToken(): string | null {
    return this.jwtSignal();
  }

}
