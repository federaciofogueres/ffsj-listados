import * as XLSX from 'xlsx';
import { ListadosService } from '../../services/listados.service';

// import function to register Swiper custom elements
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, Renderer2, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SwiperContainer } from 'swiper/element';
import { SwiperOptions } from 'swiper/types';


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

  dataToUpload: any[] = [];
  // data: any[] = []; // Los datos obtenidos desde Firestore
  keys: any[] = []; // Las claves de los objetos de datos
  showData: any[] = [];
  loading = true;

  swiperElement = signal<SwiperContainer | null>(null);
  @ViewChild('swiperContainer') swiperContainer!: ElementRef;

  constructor(
    private listadosService: ListadosService,
    private renderer: Renderer2,
    private cookieService: CookieService
    // @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loading = true;
    // this.listadosService.getAll().then((listados: any[][]) => { // Explicitly type listados as any[][]
    //   for(let key of Object.keys(listados[0])) { 
    //     this.data.push(listados[0][key as any]); // Explicitly type the index expression as 'any'
    //     this.keys.push(Object.keys(listados[0][key as any][0]));
    //     this.showData.push(listados[0][key as any].map((item: any) => ({
    //       nombre: item['NOMBRE'] || item['NOMBRE Y APELLIDOS'],
    //       asiste: item.asiste
    //     })));
    //   }
    //   this.loading = false;
    //   this.initSwiper();
    // });
    this.loadDataFromLocalStorage();
  }

  loadDataFromLocalStorage() {
    let data = this.cookieService.get('listados');
    if (data) {
      this.data = JSON.parse(data);
    }
    this.loading = false;
    // this.initSwiper();
  }

  initSwiper() {
    const swiperElemConstructor = document.querySelector('swiper-container');
    const swiperOptions: SwiperOptions = {
      slidesPerView: 1,
      navigation: true,
      pagination: true,
    };
    Object.assign(swiperElemConstructor!, swiperOptions);
    this.swiperElement.set(swiperElemConstructor as SwiperContainer);
    this.swiperElement()?.initialize();
  }

  // onFileChange(evt: any) {
  //   const target: DataTransfer = <DataTransfer>(evt.target);
  //   if (target.files.length !== 1) throw new Error('Cannot use multiple files');
  //   const reader: FileReader = new FileReader();
  //   reader.onload = (e: any) => {
  //     const bstr: string = e.target.result;
  //     const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
  
  //     // Recorre todas las hojas del libro
  //     wb.SheetNames.forEach((sheetName) => {
  //       const ws: XLSX.WorkSheet = wb.Sheets[sheetName];
  //       const data = XLSX.utils.sheet_to_json(ws);
  //       this.createData(data);
  //     });
  //     this.saveOnFirebase();
  //   };
  //   reader.readAsBinaryString(target.files[0]);
  // }

  createData(data: any[]) {
    for(let field of data) {
      field['asiste'] = false;
    }
    this.dataToUpload.push(data);
  }

  saveOnFirebase() {
    const dataObject = this.dataToUpload.reduce((obj, item, index) => {
      return {...obj, ['item' + index]: item};
    }, {});
    this.listadosService.create(dataObject, 'nuevoDoc'); // Replace this line with the following (if you are using Firestore
  }



  @ViewChild(MatPaginator) paginator!: MatPaginator;
  Boolean = Boolean;
  displayedColumns: string[] = [];
  data: any[] = [];
  dataSource!: MatTableDataSource<any>;

  activeColumns: string[] = [];
  nuevasCabeceras: Cabecera[] = [];
  archivoSubido: boolean = false;
  showInput = false;
  camposAgregados: string[] = [];

  addCampo(value: string) {
    this.camposAgregados.push(value);
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
      this.data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
      this.processExcelHeaders(wb);
      this.addAdditionalFields();
      this.sortDataAndHeaders();
      this.initializeDataSource();
    };
    reader.readAsBinaryString(target.files[0]);
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
      this.nuevasCabeceras.push({
        label: campo,
        order: this.nuevasCabeceras[0].order - 1,
        active: true,
        type: 'checkbox'
      });
  
      this.data[0].push(campo);
      for (let i = 1; i < this.data.length; i++) {
        this.data[i].push(false);
      }
    }
    this.nuevasCabeceras.sort((a, b) => a.order - b.order);
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
    
  }

}
