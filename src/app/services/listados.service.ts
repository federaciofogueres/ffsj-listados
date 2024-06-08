import { Injectable, inject } from '@angular/core';
import { Firestore, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ListadosService {

  private listadoSeleccionado: any;
  private listadoName: string = '';

  private _firestore = inject(Firestore);


  // private _storage = getStorage(this._firebaseApp, 'gs://exponinot.appspot.com');

  // create
  async create(listadoData: any, id: string) {
    await setDoc(doc(this._firestore, 'listados', id), listadoData);
  }

  // Read
  getAll() {
    console.log('holaaaaa');
    
    const queryData = query(collection(this._firestore, 'listados')); // Rename the variable to queryData
    return getDocs(queryData).then(querySnapshot => {
      const docs: any[] = [];
      querySnapshot.forEach(doc => {
        const data: any = doc.data();
        data.path = doc.ref.path; // Aquí está el 'path'
        docs.push(data);
      });
      console.log(docs);
      
      return docs;
    });
  }

  // Read one
  async getOne(id: string) {
    const ref = doc(this._firestore, 'listados', id);
    const snap = await getDoc(ref); // Replace getDocs with getDoc
    if (snap.exists()) {
      return snap.data();
    } else {
      throw new Error('No such document!');
    }
  }

  // Update
  async update(id: any, updatedData: any) {
    const ref = doc(this._firestore, 'listados', id);
    await updateDoc(ref, updatedData);
  }

  // Delete
  async delete(id: any) {
    const ref = doc(this._firestore, 'listados', id);
    await deleteDoc(ref);
  }

  setListado(listado: any) {
    this.listadoSeleccionado = listado;
  }

  getListado() {
    return this.listadoSeleccionado;
  }

  setListadoName(name: string) {
    this.listadoName = name;
  }

  getListadoName() {  
    return this.listadoName;
  }

}
