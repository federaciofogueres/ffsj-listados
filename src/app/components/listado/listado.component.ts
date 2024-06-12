import * as XLSX from 'xlsx';
import { ListadosService } from '../../services/listados.service';

// import function to register Swiper custom elements
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';


import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CookieService } from 'ngx-cookie-service';

export interface Cabecera {
  label: string;
  order: number;
  active: boolean;
  type: string;
}

@Component({
  selector: 'app-listado',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatMenuModule,
    MatIconModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './listado.component.html',
  styleUrl: './listado.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ListadoComponent {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  Boolean = Boolean;
  displayedColumns: string[] = [];
  data: any[] = [];
  dataSource!: MatTableDataSource<any>;

  activeColumns: string[] = [];
  nuevasCabeceras: Cabecera[] = [];
  archivoSubido: boolean = false;
  showInput = false;
  camposAgregados: Cabecera[] = [];
  loading: boolean = true;
  dataToUpload: any[] = [];
  showCampos: boolean = false;

  documentTitle: string = 'Sin nombre';

  constructor(
    private listadosService: ListadosService,
    private cookieService: CookieService,
    private changeDetectorRefs: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loading = true;
    this.loadDataFromCookies();
  }

  async loadDataFromCookies() {
    let label = this.cookieService.get('listado');
    console.log(label);
    let data: any = [];
    await this.listadosService.getOne(label).then((listado: any) => {
      console.log(listado);
      data = this.ordenarPropiedades(listado['item0']);
      this.documentTitle = label;
    });
    
    if(data.length > 0) {
      this.procesaDataFromCache(data);
    } else {
      data = this.listadosService.getListado();
      this.documentTitle = this.listadosService.getListadoName();
      if (data) {
        this.procesaDataFromCache(data);
      }
    }
  }

  // @ts-ignore
  ordenarPropiedades(objetos) {
    const ordenDePropiedades = ['Tipo', 'FOGUERA /BARRACA', 'Ha llegado'];
  // @ts-ignore
    return objetos.map(obj => {
      let newObj = {};
      ordenDePropiedades.forEach(prop => {// @ts-ignore
        newObj[prop] = obj[prop];
      });
      return newObj;
    });
  }

  procesaDataFromCache(data: any) {
    try {
      // this.data = JSON.parse(data);
      this.processDataHeaders(data);
      data.forEach((item: any) => {
        this.data.push(Object.values(item));
      });
      this.data.unshift(Object.keys(data[0]));
      // this.data = data;
      this.addAdditionalFields();
      this.sortDataAndHeaders();
      this.initializeDataSource();
      // if (this.dataSource) {
      //   this.dataSource.paginator = this.paginator;
      //   this.dataSource.data = this.data;
      // }
    } catch (e) {
      console.error('Error parsing data from cookies', e);
    }
  }

  loadDataFromLocalStorage() {
    let data = this.cookieService.get('listado');
    if (data) {
      this.data = JSON.parse(data);
    }
    this.loading = false;
  }

  addCampo(value: string, tipo: string) {
    if (value && value.trim() !== '' && !this.camposAgregados.find(campo => campo.label === value)) {
      const order = this.camposAgregados.length > 0 ? this.camposAgregados[this.camposAgregados.length - 1].order + 1 : 1;
      this.camposAgregados.push({ label: value, order: order, active: true, type: tipo });
    }
  }

  removeCampo(campo: string) {
    this.camposAgregados = this.camposAgregados.filter(c => c.label !== campo);
    this.nuevasCabeceras = this.nuevasCabeceras.filter(cabecera => cabecera.label !== campo);
    this.data[0] = this.data[0].filter((header: any) => header !== campo);
    for (let i = 1; i < this.data.length; i++) {
      this.data[i] = this.data[i].filter((field: any) => field !== campo);
    }
    this.displayedColumns = this.displayedColumns.filter((column: any) => column !== campo);
    this.activeColumns = this.activeColumns.filter((column: any) => column !== campo);
    this.changeDetectorRefs.detectChanges();
  }

  changeStateCabecera(cabecera: Cabecera) {
    if (cabecera) {
      if (cabecera.active) {
        cabecera.active = false;
        this.activeColumns = this.activeColumns.filter((column) => column !== cabecera.label);
      } else {
        cabecera.active = true;
        this.activeColumns.push(cabecera.label);
        this.activeColumns.sort((a, b) => { return this.nuevasCabeceras.find(c => c.label === a)!.order - this.nuevasCabeceras.find(c => c.label === b)!.order});
      }
    }
    console.log(this.nuevasCabeceras);
  }

  reiniciaDatos() {
    this.data = [];
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.data = [];
    }
    this.nuevasCabeceras = [];
  }

  onFileChange(evt: any) {
    this.reiniciaDatos();
    const target: DataTransfer = <DataTransfer>(evt.target);
  
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
  
    const reader: FileReader = new FileReader();
  
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      this.documentTitle = wsname;
      this.data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
      this.processExcelHeaders(wb);
      this.addAdditionalFields();
      this.sortDataAndHeaders();
      this.initializeDataSource();
      this.createData();
      this.saveOnFirebase();
    };
    reader.readAsBinaryString(target.files[0]);
  }

  processDataHeaders(listado: any[]) {
    if (listado && listado.length > 0) {
      // Tomamos el primer objeto del array para obtener las cabeceras
      const firstItem = listado[0];
      // Obtenemos las claves del objeto y las asignamos a this.displayedColumns
      let headers = Object.keys(firstItem);
      headers.sort((a, b) => firstItem[a] - firstItem[b]);
      headers.map((header: any, index: any) => {
        if (firstItem[header] === false || firstItem[header] === true) {
          this.nuevasCabeceras.push({
            label: header,
            order: index,
            active: true,
            type: 'checkbox'
          });
        } else {
          this.nuevasCabeceras.push( {
            label: header,
            order: index,
            active: true,
            type: 'text'
          });
        }
      });
    }
  }
  
  processExcelHeaders(wb: XLSX.WorkBook) {
    let worksheet = wb.Sheets[wb.SheetNames[0]];
    let excelHeaders:any = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
    excelHeaders.map((header: any, index: any) => {
      this.nuevasCabeceras.push( {
        label: header,
        order: index,
        active: true,
        type: 'text'
      });
    });
  }
  
  addAdditionalFields() {
    for (let campo of this.camposAgregados) {
      this.nuevasCabeceras.push(campo);
      this.data[0].push(campo);
      for (let i = 1; i < this.data.length; i++) {
        this.data[i].push(false);
      }
    }
    // this.nuevasCabeceras.sort((a, b) => a.order - b.order);
  }

  sortDataAndHeaders() {
    this.displayedColumns = this.nuevasCabeceras.filter(cabecera => cabecera.active).map(cabecera => cabecera.label);
    this.activeColumns = this.displayedColumns;
    this.data = this.data.map(row => {
      let newRow: any = [];
      this.nuevasCabeceras.forEach(header => {
        newRow.push(row[this.data[0].indexOf(header.label)]);
      });
      return newRow;
    });
  }
  
  initializeDataSource() {
    this.dataSource = new MatTableDataSource(this.data);
    this.data.shift();
    console.log(this.displayedColumns);
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
    }
    this.archivoSubido = true;
  }

  downloadExcelTemplate() {
    console.log('Downloading template xls');
    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();
  
    // Crear un objeto donde cada clave es el campo 'label' de cada elemento de 'camposAgregados' y el valor es una cadena vacía
    const templateRow = this.camposAgregados.reduce((obj, campo) => ({ ...obj, [campo.label]: '' }), {});
  
    // Crear una nueva hoja de cálculo a partir de los datos de 'camposAgregados'
    const ws = XLSX.utils.json_to_sheet([templateRow]);
  
    // Añadir la hoja de cálculo al libro de trabajo
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  
    // Escribir el libro de trabajo en un archivo y descargarlo
    XLSX.writeFile(wb, "template.xlsx");
  }

  createData() {
    for(let field of this.data) {
      field['asiste'] = false;
    }
    this.dataToUpload.push(this.data);
    this.dataToUpload.unshift(this.displayedColumns);
  }

  saveOnFirebase() {
    // Asumimos que el primer elemento de dataToUpload son las cabeceras
    const headers = this.dataToUpload[0];
    const data = this.dataToUpload[1]; // El resto son los datos

    // let objetos: any[] = [];
    // for (let row of data) {
    //   let objetoToPush: any = {};
    //   for (let i = 0; i < headers.length; i++) {
    //     objetoToPush[headers[i]] = row[i];
    //   }
    //   objetos.push(objetoToPush);
    // }
    // console.log(objetos);
    
    const items = data.map((item: any) => {
      return item.reduce((result: any, field: any, i: any) => {
        result[headers[i]] = field;
        return result;
      }, {});
    });
  
    const dataObject = { 'item0': items };
  
    this.listadosService.create(dataObject, this.documentTitle);
  }
  
  async updateListado(element: any, hola: any) {
    // element = !element;
    console.log(this.data);
    console.log(hola);
    
    console.log(this.dataSource);
    
    await this.preUploadData(element);

    // this.dataToUpload = this.data;
    // const items = data.map((item: any) => {

    //   return item.reduce((result: any, field: any, i: any) => {
    //     result[headers[i]] = field;
    //     return result;
    //   }, {});
    // });
  
    const dataObject = { 'item0': this.dataToUpload };
    this.listadosService.update(this.documentTitle, dataObject); // Replace this line with the following (if you are using Firestore
    this.reloadDataFromCookies();
    // this.listadosService.update(this.documentTitle, this.data);
  }

  async preUploadData(element: any) {
    await this.listadosService.getOne(this.documentTitle).then((listado: any) => {
      console.log(listado);
      let data = this.ordenarPropiedades(listado['item0']);
      data.map((item: any) => {
        if (item['Tipo'] === element[0] && item['FOGUERA /BARRACA'] === element[1])
          item['Ha llegado'] = element[2];
        });
      this.dataToUpload = data;
    });
  }

  reloadDataFromCookies() {
    this.listadosService.getOne(this.documentTitle).then((listado: any) => {
      console.log(listado);
      let data = this.ordenarPropiedades(listado['item0']);
      this.data = [];
      data.forEach((item: any) => {
        this.data.push(Object.values(item));
      });
      this.dataSource = new MatTableDataSource(this.data);
      if (this.dataSource) {
        this.dataSource.paginator = this.paginator;
      }
      this.changeDetectorRefs.detectChanges();
    });
  }
}
