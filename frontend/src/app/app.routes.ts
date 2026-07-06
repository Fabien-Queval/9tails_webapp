import { Routes } from '@angular/router';
import { Accueil } from './pages/accueil/accueil';
import { Connexion } from './pages/connexion/connexion';
import { TableauDeBord } from './pages/tableau-de-bord/tableau-de-bord';





export const routes: Routes = [
  { path: '',                   component: Accueil },
  { path: 'connexion',          component: Connexion },
  { path: 'tableau-de-bord',    component: TableauDeBord },
];
