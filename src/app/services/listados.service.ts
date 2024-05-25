import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, deleteDoc, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListadosService {


  private _firestore = inject(Firestore);

  private _collection = collection(this._firestore, 'listados');

  // private _storage = getStorage(this._firebaseApp, 'gs://exponinot.appspot.com');

  // create
  async create(listadoData: any, id: string) {
    await setDoc(doc(this._firestore, 'listados', id), listadoData);
  }

  // Read
  getAll() {
    return collectionData(this._collection) as Observable<any[]>;
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

}
