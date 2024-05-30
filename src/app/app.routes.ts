import { Routes } from '@angular/router';
import { ListadoComponent } from './components/listado/listado.component';
import { ListadosComponent } from './components/listados/listados.component';

export const routes: Routes = [
    { path: 'listados', component: ListadosComponent },
    { path: 'listados/:id', component: ListadoComponent },
    { path: '**', redirectTo: 'listados'},
];
