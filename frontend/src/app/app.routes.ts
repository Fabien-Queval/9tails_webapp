import { Routes } from '@angular/router';
import { Accueil } from './pages/accueil/accueil';
import { Connexion } from './pages/connexion/connexion';
import { TableauDeBord } from './pages/tableau-de-bord/tableau-de-bord';
import {authGuard} from './core/auth-guard';
import {Inscription} from './pages/inscription/inscription';
import {NouvelleCampagne} from './pages/nouvelle-campagne/nouvelle-campagne';





export const routes: Routes = [
  { path: '',                   component: Accueil },
  { path: 'connexion',          component: Connexion },
  { path: 'tableau-de-bord',    component: TableauDeBord, canActivate: [authGuard] },
  { path: 'inscription',        component: Inscription },
  { path: 'campagnes/nouvelle', component: NouvelleCampagne }
];
