import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ListadosService } from '../../services/listados.service';

export interface Listado {
  label: string;
  value: string;
  key: string;
}

@Component({
  selector: 'app-listados',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './listados.component.html',
  styleUrl: './listados.component.scss'
})
export class ListadosComponent {

  Boolean = Boolean;
  loading: boolean = true;

  keys: string[] = [];
  data: Listado[] = [];

  constructor(
    private listadosService: ListadosService,
    private router: Router,
    private cookieService: CookieService
  ) {}


  ngOnInit() {
    console.log('ListadosComponent');
    
    this.listadosService.getAll().then((listados: any[][]) => { // Explicitly type listados as any[][]
    //   // for(let key of Object.keys(listados[0])) { 
    //   //   this.data.push(listados[0][key as any]); // Explicitly type the index expression as 'any'
    //   //   this.keys.push(Object.keys(listados[0][key as any][0]));
    //   //   this.showData.push(listados[0][key as any].map((item: any) => ({
    //   //     nombre: item['NOMBRE'] || item['NOMBRE Y APELLIDOS'],
    //   //     asiste: item.asiste
    //   //   }));
    //   // }
      console.log(listados);
      

      for (let listadoGroup of listados) {
        console.log(listadoGroup);
        let dataToPush: Listado = {
          label: '',
          value: '',
          key: ''
        }
        if (Array.isArray(listadoGroup)) {
          this.keys.push(listadoGroup[0]['path'])
          dataToPush.key = listadoGroup[0]['path'];
          dataToPush.label = listadoGroup[0]['path'].split('/')[1];
          dataToPush.value = listadoGroup[0]['item0'];
          this.data.push(dataToPush);
          for (let listado of listadoGroup) {
            console.log(listado);
          }
        } else if(typeof listadoGroup === 'object') {
          this.keys.push(listadoGroup['path'])
          dataToPush.key = listadoGroup['path'];
          // @ts-ignore
          dataToPush.label = listadoGroup['path'].split('/')[1];
          dataToPush.value = listadoGroup['item0'];
          this.data.push(dataToPush);
        }
        
      }
      console.log('keys -> ', this.keys);
      this.loading = false;
    });
  }
  
  viewItem(element: any) {
    this.listadosService.setListado(element.value);
    this.router.navigate([`/${element.key}`]);
  }
}
