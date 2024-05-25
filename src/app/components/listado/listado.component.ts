import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { ListadosService } from '../../services/listados.service';

@Component({
  selector: 'app-listado',
  standalone: true,
  imports: [],
  templateUrl: './listado.component.html',
  styleUrl: './listado.component.scss'
})
export class ListadoComponent {

  dataToUpload: any[] = [];
  data: any[] = []; // Los datos obtenidos desde Firestore
  keys: any[] = []; // Las claves de los objetos de datos

  constructor(
    private listadosService: ListadosService
  ) {}

  ngOnInit() {
    this.listadosService.getAll().subscribe((listados: any[][]) => { // Explicitly type listados as any[][]
      console.log(listados);
      console.log(listados[0]);
      Object.keys(listados[0]).forEach((key: any) => {
        this.data.push(listados[0][key]);
        this.keys.push(Object.keys(listados[0][key][0]));
      });

      console.log(this.data);
      console.log(this.keys);
      

      
      
      // listados[0].forEach((listado: any) => {
      //   this.data.push(listado);
      // });
      
      // this.keys = listados.map(listado => {
      //   if (listado.length > 0) {
      //     // Obtiene las claves del primer objeto de datos para cada array
      //     return Object.keys(listado[0]);
      //   } else {
      //     return [];
      //   }
      // });
    });
  }

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
  
      // Recorre todas las hojas del libro
      wb.SheetNames.forEach((sheetName) => {
        const ws: XLSX.WorkSheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws);
        this.createData(data);
      });
      this.saveOnFirebase();
    };
    reader.readAsBinaryString(target.files[0]);
  }

  createData(data: any[]) {
    this.dataToUpload.push(data);
  }

  saveOnFirebase() {
    const dataObject = this.dataToUpload.reduce((obj, item, index) => {
      return {...obj, ['item' + index]: item};
    }, {});
    console.log(dataObject);
    
    console.log(this.dataToUpload);
    this.listadosService.create(dataObject, 'recompensas'); // Replace this line with the following (if you are using Firestore
  }

}
