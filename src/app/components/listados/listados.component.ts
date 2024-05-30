import { Component } from '@angular/core';
import { ListadosService } from '../../services/listados.service';

export interface Listado {

}

@Component({
  selector: 'app-listados',
  standalone: true,
  imports: [],
  templateUrl: './listados.component.html',
  styleUrl: './listados.component.scss'
})
export class ListadosComponent {

  data: any[] = [];
  loading: boolean = true;

  keys: string[] = [];

  constructor(
    private listadosService: ListadosService
  ) {}


  ngOnInit() {
    this.listadosService.getAll().then((listados: any[][]) => { // Explicitly type listados as any[][]
      // for(let key of Object.keys(listados[0])) { 
      //   this.data.push(listados[0][key as any]); // Explicitly type the index expression as 'any'
      //   this.keys.push(Object.keys(listados[0][key as any][0]));
      //   this.showData.push(listados[0][key as any].map((item: any) => ({
      //     nombre: item['NOMBRE'] || item['NOMBRE Y APELLIDOS'],
      //     asiste: item.asiste
      //   }));
      // }

      for (let listadoGroup of listados) {
        console.log(listadoGroup);
        if (Array.isArray(listadoGroup)) {
          this.keys.push(listadoGroup[0]['path'])
        } else if(typeof listadoGroup === 'object') {
          console.log('Objeto');
          
        }
        
        for (let listado of listadoGroup) {
          console.log(listado);
        }
      }
      this.loading = false;
    });
  }
}
