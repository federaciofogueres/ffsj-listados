import * as XLSX from 'xlsx';
import { ListadosService } from '../../services/listados.service';

// import function to register Swiper custom elements
import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, Renderer2, ViewChild, signal } from '@angular/core';
import { SwiperContainer } from 'swiper/element';
import { SwiperOptions } from 'swiper/types';

@Component({
  selector: 'app-listado',
  standalone: true,
  imports: [],
  templateUrl: './listado.component.html',
  styleUrl: './listado.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ListadoComponent {

  dataToUpload: any[] = [];
  data: any[] = []; // Los datos obtenidos desde Firestore
  keys: any[] = []; // Las claves de los objetos de datos
  showData: any[] = [];
  loading = true;

  swiperElement = signal<SwiperContainer | null>(null);
  @ViewChild('swiperContainer') swiperContainer!: ElementRef;

  constructor(
    private listadosService: ListadosService,
    private renderer: Renderer2,
    // @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loading = true;
    this.listadosService.getAll().then((listados: any[][]) => { // Explicitly type listados as any[][]
      for(let key of Object.keys(listados[0])) { 
        this.data.push(listados[0][key as any]); // Explicitly type the index expression as 'any'
        this.keys.push(Object.keys(listados[0][key as any][0]));
        this.showData.push(listados[0][key as any].map((item: any) => ({
          nombre: item['NOMBRE'] || item['NOMBRE Y APELLIDOS'],
          asiste: item.asiste
        })));
      }
      this.loading = false;
      this.initSwiper();
    });
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

}
