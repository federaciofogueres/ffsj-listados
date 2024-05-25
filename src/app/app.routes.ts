import { Routes } from '@angular/router';
import { ListadoComponent } from './components/listado/listado.component';

export const routes: Routes = [
    { path: 'listados', component: ListadoComponent },
    { path: 'listados/:id', component: ListadoComponent },
    { path: '**', redirectTo: 'listados'},
];
