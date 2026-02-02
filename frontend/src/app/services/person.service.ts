import { Injectable } from '@angular/core';
import { FirestoreGenericService } from './firestore-generic.service';
import { Person } from '../model/person.model';
import { collectionData, limit, query, where } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';

/**
 * Service for Person persistent documents in Firestore.
 */
@Injectable({ providedIn: 'root' })
export class PersonService extends FirestoreGenericService<Person> {
  protected override getCollectionName(): string {
    return 'person';
  }

  findByEmail(email: string): Observable<Person | undefined> {
    const q = query(this.itemsCollection(), where('email', '==', email), limit(1));
    return (collectionData(q, { idField: 'id' }) as Observable<Person[]>).pipe(
      map(results => results[0])
    );
  }
}
