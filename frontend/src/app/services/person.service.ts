import { Injectable } from '@angular/core';
import { FirestoreGenericService } from './firestore-generic.service';
import { Person } from '../model/person.model';
import { collectionData, limit } from '@angular/fire/firestore';
import { map, Observable, from } from 'rxjs';
import { getDocs, orderBy as fbOrderBy, startAfter as fbStartAfter, limit as fbLimit, query as fbQuery, startAt as fbStartAt, endAt as fbEndAt, where as fbWhere } from 'firebase/firestore';

/**
 * Service for Person persistent documents in Firestore.
 */
@Injectable({ providedIn: 'root' })
export class PersonService extends FirestoreGenericService<Person> {
  protected override getCollectionName(): string {
    return 'person';
  }

  findByEmail(email: string): Observable<Person | undefined> {
    const q = fbQuery(this.itemsCollection(), fbOrderBy('email'), fbLimit(1));
    // Use generic query helper
    return from(getDocs(fbQuery(this.itemsCollection(), fbWhere('email', '==', email), fbLimit(1)))).pipe(
      map((qs) => {
        let found: Person | undefined = undefined;
        qs.forEach((qds) => {
          const data = qds.data() as Person;
          data.id = qds.id;
          found = data;
        });
        return found;
      })
    );
  }

  /**
   * Combined search and pagination. Searches across firstName, lastName, email (case-sensitive prefix match).
   * Results are ordered by lastUpdated desc with cursor-based pagination.
   * @param searchTerm - Search term (prefix match on firstName, lastName, email). Empty = all persons
   * @param pageSize - Number of results per page
   * @param startAfterValue - Cursor value (lastUpdated) for pagination
   * @returns Object with filtered+paged persons and nextCursor for the next page
   */
  public pagedSearch(
    searchTerm: string,
    pageSize: number,
    startAfterValue?: string
  ): Observable<{ persons: Person[]; nextCursor?: string }> {
    // If no search term, fetch all ordered by lastUpdated
    if (!searchTerm || searchTerm.trim().length === 0) {
      const order = fbOrderBy('lastUpdated', 'desc');
      const limiter = fbLimit(pageSize);
      let q;
      if (startAfterValue) {
        q = fbQuery(this.itemsCollection(), order, fbStartAfter(startAfterValue), limiter);
      } else {
        q = fbQuery(this.itemsCollection(), order, limiter);
      }
      return from(getDocs(q)).pipe(
        map((qs) => {
          const list: Person[] = [];
          qs.forEach((docSnap) => {
            const data = docSnap.data() as Person;
            data.id = docSnap.id;
            list.push(data);
          });
          const nextCursor = list.length > 0 ? list[list.length - 1].lastUpdated : undefined;
          return { persons: list, nextCursor };
        })
      );
    }

    // Fetch all results from the three prefix queries and filter+paginate client-side
    const endTerm = searchTerm + '\uf8ff';
    const q1 = fbQuery(this.itemsCollection(), fbOrderBy('firstName'), fbStartAt(searchTerm), fbEndAt(endTerm), fbLimit(500));
    const q2 = fbQuery(this.itemsCollection(), fbOrderBy('lastName'), fbStartAt(searchTerm), fbEndAt(endTerm), fbLimit(500));
    const q3 = fbQuery(this.itemsCollection(), fbOrderBy('email'), fbStartAt(searchTerm), fbEndAt(endTerm), fbLimit(500));

    return from(Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)])).pipe(
      map((results) => {
        // Merge all results, dedup by id
        const mapById = new Map<string, Person>();
        for (const qs of results) {
          qs.forEach((ds) => {
            const data = ds.data() as Person;
            data.id = ds.id;
            if (!mapById.has(data.id)) mapById.set(data.id, data);
          });
        }
        // Sort by lastUpdated desc
        let allResults = Array.from(mapById.values());
        allResults.sort((a, b) => {
          const aVal = parseInt(a.lastUpdated, 10) || 0;
          const bVal = parseInt(b.lastUpdated, 10) || 0;
          return bVal - aVal;
        });

        // Apply cursor pagination on sorted results
        let startIdx = 0;
        if (startAfterValue) {
          startIdx = allResults.findIndex(p => p.lastUpdated === startAfterValue) + 1;
          if (startIdx <= 0) startIdx = 0;
        }
        const paginated = allResults.slice(startIdx, startIdx + pageSize);
        const nextCursor = paginated.length > 0 && paginated.length === pageSize
          ? paginated[paginated.length - 1].lastUpdated
          : undefined;
        return { persons: paginated, nextCursor };
      })
    );
  }
}
