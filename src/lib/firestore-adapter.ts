import { supabase } from './supabase';

export class CollectionReference {
  constructor(public collectionPath: string) {}
}

export class DocReference {
  constructor(public collectionPath: string, public id: string) {}
}

export class Query {
  constructor(public col: CollectionReference, public operations: any[]) {}
}

export function collection(db: any, path: string) {
  return new CollectionReference(path);
}

export function doc(db: any, path: string, id?: string) {
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
  return new DocReference(path, id);
}

export function query(col: CollectionReference, ...operations: any[]) {
  return new Query(col, operations);
}

export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(n: number) {
  return { type: 'limit', n };
}

const mapValue = (val: any) => {
  if (val && typeof val === 'object' && val.seconds !== undefined) {
    // Timestamp mock
    return val.seconds * 1000;
  }
  return val;
}

const applyQueryOperations = (queryBuilder: any, operations: any[]) => {
  let hasOrder = false;
  
  operations.forEach(op => {
    if (op.type === 'where') {
      const fieldPath = `data->>${op.field}`;
      const val = mapValue(op.value);
      if (op.op === '==') {
        if (typeof val === 'boolean') {
           // supabase jsonb boolean eq requires string 'true' / 'false' or casting
           // work-around: we can do eq('data->field', val) not ->>
           queryBuilder = queryBuilder.eq(`data->${op.field}`, val);
        } else {
           queryBuilder = queryBuilder.eq(fieldPath, val);
        }
      }
      else if (op.op === '<') queryBuilder = queryBuilder.lt(fieldPath, val);
      else if (op.op === '>') queryBuilder = queryBuilder.gt(fieldPath, val);
      else if (op.op === '<=') queryBuilder = queryBuilder.lte(fieldPath, val);
      else if (op.op === '>=') queryBuilder = queryBuilder.gte(fieldPath, val);
      else if (op.op === 'array-contains') queryBuilder = queryBuilder.contains(`data->${op.field}`, JSON.stringify([val]));
    }
  });

  operations.forEach(op => {
    if (op.type === 'orderBy') {
      hasOrder = true;
      queryBuilder = queryBuilder.order(`data->${op.field}`, { ascending: op.direction === 'asc' });
    }
  });

  operations.forEach(op => {
    if (op.type === 'limit') {
      queryBuilder = queryBuilder.limit(op.n);
    }
  });

  return queryBuilder;
};

export async function getDocs(q: Query | CollectionReference) {
  let colPath = q instanceof Query ? q.col.collectionPath : q.collectionPath;
  let qb = supabase.from('firestore_docs').select('*').eq('collection_id', colPath);
  
  if (q instanceof Query) {
    qb = applyQueryOperations(qb, q.operations);
  }

  const { data, error } = await qb;
  if (error) {
    console.error("Adapter getDocs error:", error);
    throw error;
  }

  const docs = (data || []).map(row => ({
    id: row.id,
    data: () => row.data,
    exists: () => true
  }));

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (cb: any) => docs.forEach(cb)
  };
}

export async function getDoc(ref: DocReference) {
  const { data, error } = await supabase
    .from('firestore_docs')
    .select('*')
    .eq('collection_id', ref.collectionPath)
    .eq('id', ref.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data) {
    return {
      id: data.id,
      exists: () => true,
      data: () => data.data
    };
  }

  return {
    id: ref.id,
    exists: () => false,
    data: () => undefined
  };
}

export async function setDoc(ref: DocReference, dataP: any, options?: { merge?: boolean }) {
  const existing = await getDoc(ref);
  let finalData = { ...dataP };
  
  if (options?.merge && existing.exists()) {
    finalData = { ...existing.data(), ...dataP };
  }

  const { error } = await supabase
    .from('firestore_docs')
    .upsert({
      collection_id: ref.collectionPath,
      id: ref.id,
      data: finalData,
      updated_at: Date.now()
    }, { onConflict: 'collection_id,id' });

  if (error) throw error;
}

export async function addDoc(col: CollectionReference, dataP: any) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const ref = new DocReference(col.collectionPath, id);
  await setDoc(ref, dataP);
  return { id, path: ref.collectionPath + '/' + id };
}

export async function updateDoc(ref: DocReference, dataP: any) {
  const existing = await getDoc(ref);
  if (!existing.exists()) throw new Error("Document not found");
  
  const finalData = { ...existing.data(), ...dataP };
  
  const { error } = await supabase
    .from('firestore_docs')
    .update({
      data: finalData,
      updated_at: Date.now()
    })
    .eq('collection_id', ref.collectionPath)
    .eq('id', ref.id);

  if (error) throw error;
}

export async function deleteDoc(ref: DocReference) {
  const { error } = await supabase
    .from('firestore_docs')
    .delete()
    .eq('collection_id', ref.collectionPath)
    .eq('id', ref.id);

  if (error) throw error;
}

export function onSnapshot(ref: any, callback: any, errorCallback?: any) {
  let colPath = '';
  let docId = null;

  if (ref instanceof DocReference) {
    colPath = ref.collectionPath;
    docId = ref.id;
  } else if (ref instanceof CollectionReference) {
    colPath = ref.collectionPath;
  } else if (ref instanceof Query) {
    colPath = ref.col.collectionPath;
  }

  // Initial fetch
  if (ref instanceof DocReference) {
    getDoc(ref).then(callback).catch(err => {
      if (errorCallback) errorCallback(err);
      else console.error("onSnapshot getDoc error:", err);
    });
  } else {
    getDocs(ref).then(callback).catch(err => {
      if (errorCallback) errorCallback(err);
      else console.error("onSnapshot getDocs error:", err);
    });
  }

  // Polling fallback to simulate realtime for this adapter without complex real-time subscriptions setup per query
  const interval = setInterval(() => {
    if (ref instanceof DocReference) {
      getDoc(ref).then(callback).catch(e => { /* silence interval errors */ });
    } else {
      getDocs(ref).then(callback).catch(e => { /* silence interval errors */ });
    }
  }, 5000);

  return () => clearInterval(interval);
}

export function serverTimestamp() {
  return Date.now();
}

export const Timestamp = {
  now: () => ({ seconds: Math.floor(Date.now() / 1000), toMillis: () => Date.now() })
};

export function getFirestore() {
  return {}; // stub db
}

export async function getDocFromServer(ref: DocReference) {
  return getDoc(ref);
}

export class WriteBatch {
  commit = async () => {};
  update = (ref: any, data: any) => {};
  set = (ref: any, data: any) => {};
  delete = (ref: any) => {};
}

export function writeBatch(db: any) {
  return new WriteBatch();
}
