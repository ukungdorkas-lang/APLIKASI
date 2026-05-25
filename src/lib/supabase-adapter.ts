import { supabase } from "./supabase";

export class CollectionReference {
  constructor(public collectionPath: string) {}
}

export class DocReference {
  constructor(
    public collectionPath: string,
    public id: string,
  ) {}
}

export class Query {
  constructor(
    public col: CollectionReference,
    public operations: any[],
  ) {}
}

export function collection(db: any, path: string) {
  return new CollectionReference(path);
}

export function doc(db: any, path: string, id?: string) {
  if (!id) {
    id = uuidv4();
  }
  return new DocReference(path, id);
}

export function query(col: CollectionReference, ...operations: any[]) {
  return new Query(col, operations);
}

export function where(field: string, op: string, value: any) {
  return { type: "where", field, op, value };
}

export function orderBy(field: string, direction: "asc" | "desc" = "asc") {
  return { type: "orderBy", field, direction };
}

export function limit(n: number) {
  return { type: "limit", n };
}

const mapValue = (val: any) => {
  if (val && typeof val === "object" && val.seconds !== undefined) {
    return val.seconds * 1000;
  }
  return val;
};

const toSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const toCamelCase = (str: string) =>
  str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const convertKeysToSnake = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(convertKeysToSnake);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      let snakeKey = toSnakeCase(key);
      if (
        snakeKey === "created_at" ||
        snakeKey === "updated_at" ||
        snakeKey === "date" ||
        snakeKey === "resolved_at"
      ) {
        // just pass it along
      }
      acc[snakeKey] = convertKeysToSnake(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const convertKeysToCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(convertKeysToCamel);
  // Special rule: if it's already got camelCase from old firestore_docs, don't mess it up, just camelify snake case things
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      acc[toCamelCase(key)] = convertKeysToCamel(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const VALID_COLUMNS: Record<string, Set<string>> = {
  reports: new Set([
    "id",
    "reporterName",
    "phoneNumber",
    "type",
    "level",
    "description",
    "location",
    "mediaUrl",
    "status",
    "createdat",
    "resolvedAt",
    "documentation",
    "officerNotes",
    "newsGenerated",
    "media",
    "photos",
    "report_number",
    "reportNumber"
  ]),
  news: new Set([
    "id",
    "reportId",
    "title",
    "content",
    "date",
    "location",
    "type",
    "status",
    "isAIGenerated",
    "aiPrompt",
    "photos",
    "videos",
    "personnelCount",
    "unitsUsed"
  ])
};

const resolveFieldName = (table: string, field: string) => {
  if (table === "reports") {
    if (field === "created_at" || field === "createdAt" || field === "createdat") return "created_at";
    if (field === "reporter_name" || field === "reporterName") return "reporterName";
    if (field === "phone_number" || field === "phoneNumber") return "phoneNumber";
    if (field === "media_url" || field === "mediaUrl") return "mediaUrl";
    if (field === "news_generated" || field === "newsGenerated") return "newsGenerated";
    if (field === "resolved_at" || field === "resolvedAt") return "resolvedAt";
    if (field === "officer_notes" || field === "officerNotes") return "officerNotes";
    if (field === "report_number" || field === "reportNumber" || field === "reportNo" || field === "report_no") return "report_number";
  }
  if (table === "news") {
    if (field === "report_id" || field === "reportId") return "reportId";
    if (field === "is_ai_generated" || field === "isAIGenerated") return "isAIGenerated";
    if (field === "personnel_count" || field === "personnelCount") return "personnelCount";
    if (field === "units_used" || field === "unitsUsed") return "unitsUsed";
    if (field === "ai_prompt" || field === "aiPrompt") return "aiPrompt";
  }
  if (field === "created_at" || field === "createdAt" || field === "createdat") return "created_at";
  if (field === "updated_at" || field === "updatedAt" || field === "updatedat") return "updated_at";
  return toSnakeCase(field);
};

const mapDocumentData = (table: string, row: any) => {
  if (!row) return row;
  if (table === "firestore_docs") {
    return row.data;
  }
  const camel = convertKeysToCamel(row);
  if (table === "reports") {
    const ts = row.createdat || row.created_at || row.createdAt || Date.now();
    camel.createdAt = ts;
    camel.created_at = ts;
    camel.createdat = ts;
    
    const loc = row.location && typeof row.location === "object" ? row.location : {};
    const dbRepNum = loc.reportNumber || loc.report_number || row.report_number || row.reportNumber || row.report_no || row.reportNo || row.report_num;
    const repNum = dbRepNum || (row.id ? `DMK-${row.id.substring(0, 8).toUpperCase()}` : "");
    camel.reportNumber = repNum;
    camel.report_number = repNum;
    camel.reportNo = repNum;
    camel.report_no = repNum;

    const resAt = row.resolvedAt || row.resolved_at;
    if (resAt) {
      camel.resolvedAt = resAt;
      camel.resolved_at = resAt;
    }
  }
  return camel;
};

const applyQueryOperations = (table: string, queryBuilder: any, operations: any[], useCamel: boolean = false) => {
  operations.forEach((op) => {
    if (op.type === "where") {
      let fieldPath = useCamel ? toCamelCase(op.field) : resolveFieldName(table, op.field);
      const val = mapValue(op.value);
      if (op.op === "==") {
        queryBuilder = queryBuilder.eq(fieldPath, val);
      } else if (op.op === "<") queryBuilder = queryBuilder.lt(fieldPath, val);
      else if (op.op === ">") queryBuilder = queryBuilder.gt(fieldPath, val);
      else if (op.op === "<=") queryBuilder = queryBuilder.lte(fieldPath, val);
      else if (op.op === ">=") queryBuilder = queryBuilder.gte(fieldPath, val);
      else if (op.op === "array-contains")
        queryBuilder = queryBuilder.contains(fieldPath, JSON.stringify([val]));
    }
  });

  operations.forEach((op) => {
    if (op.type === "orderBy") {
      let fieldPath = useCamel ? toCamelCase(op.field) : resolveFieldName(table, op.field);
      queryBuilder = queryBuilder.order(fieldPath, {
        ascending: op.direction === "asc",
        nullsFirst: false,
      });
    }
  });

  operations.forEach((op) => {
    if (op.type === "limit") {
      queryBuilder = queryBuilder.limit(op.n);
    }
  });

  return queryBuilder;
};

// Mappings for table names
const tableMap = (colPath: string) => {
  if (["settings", "menus", "footer_links"].includes(colPath))
    return "firestore_docs";
  return colPath;
};

export async function getDocs(q: Query | CollectionReference) {
  const colPath = q instanceof Query ? q.col.collectionPath : q.collectionPath;
  const table = tableMap(colPath);
  let qb = supabase.from(table).select("*");

  if (table === "firestore_docs") {
    qb = qb.eq("collection_id", colPath);
  }

  if (q instanceof Query) {
    qb = applyQueryOperations(table, qb, q.operations, false);
  }

  let { data, error } = await qb;

  if (error && error.code === "42703" && q instanceof Query) {
    console.warn(`Detected column mismatch (42703) in getDocs for ${colPath}, retrying with camelCase field filters...`);
    let retryQb = supabase.from(table).select("*");
    if (table === "firestore_docs") {
      retryQb = retryQb.eq("collection_id", colPath);
    }
    retryQb = applyQueryOperations(table, retryQb, q.operations, true);
    const { data: retryData, error: retryError } = await retryQb;
    if (!retryError) {
      data = retryData;
      error = null;
    } else {
      console.error(`Both snake_case and camelCase queries failed for ${colPath}:`, retryError);
    }
  }

  if (error) {
    console.error(`Supabase DB Error (getDocs for ${colPath}):`, error);
    return { docs: [], empty: true, size: 0, forEach: () => {} };
  }

  const docs = (data || []).map((row) => ({
    id: row.id || row.id_string || row.report_number, // fallback IDs
    data: () => mapDocumentData(table, row),
    exists: () => true,
  }));

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (cb: any) => docs.forEach(cb),
  };
}

export async function getDoc(ref: DocReference) {
  const table = tableMap(ref.collectionPath);

  let query = supabase.from(table).select("*").eq("id", ref.id);
  if (table === "firestore_docs") {
    query = query.eq("collection_id", ref.collectionPath);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    console.error(
      `Supabase DB Error (getDoc for ${ref.collectionPath}):`,
      error,
    );
  }

  if (data) {
    return {
      id: data.id || ref.id,
      exists: () => true,
      data: () => mapDocumentData(table, data),
    };
  }

  return {
    id: ref.id,
    exists: () => false,
    data: () => undefined,
  };
}

export async function setDoc(
  ref: DocReference,
  dataP: any,
  options?: { merge?: boolean },
) {
  const table = tableMap(ref.collectionPath);
  const existing = await getDoc(ref);
  let finalData = { ...dataP };

  if (options?.merge && existing.exists()) {
    finalData = { ...existing.data(), ...dataP };
  }

  if (table === "firestore_docs") {
    const { error } = await supabase.from(table).upsert(
      {
        collection_id: ref.collectionPath,
        id: ref.id,
        data: finalData,
        updated_at: Date.now(),
      },
      { onConflict: "collection_id,id" },
    );
    if (error) console.error("setDoc firestore_docs error", error);
    return;
  }

  const mappedData: any = {};
  Object.keys(finalData).forEach((key) => {
    const targetKey = resolveFieldName(table, key);
    if (!VALID_COLUMNS[table] || VALID_COLUMNS[table].has(targetKey)) {
      mappedData[targetKey] = finalData[key];
    }
  });
  mappedData.id = ref.id; // Force ID

  const { error } = await supabase
    .from(table)
    .upsert(mappedData, { onConflict: "id" });

  if (error) {
    console.warn(`Upsert failed, falling back to basic insert for ${table}. Details:`, error);
    const { error: insertError } = await supabase.from(table).insert(mappedData);
    if (insertError) {
      console.error(`Insert fallback failed for ${table}:`, insertError);
    }
  }
}

function uuidv4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function addDoc(col: CollectionReference, dataP: any) {
  const id = uuidv4();
  const ref = new DocReference(col.collectionPath, id);
  await setDoc(ref, dataP);
  return { id, path: ref.collectionPath + "/" + id };
}

export async function updateDoc(ref: DocReference, dataP: any) {
  const table = tableMap(ref.collectionPath);

  if (table === "firestore_docs") {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await setDoc(ref, { ...existing.data(), ...dataP });
    }
    return;
  }

  const mappedData: any = {};
  Object.keys(dataP).forEach((key) => {
    const targetKey = resolveFieldName(table, key);
    if (!VALID_COLUMNS[table] || VALID_COLUMNS[table].has(targetKey)) {
      mappedData[targetKey] = dataP[key];
    }
  });

  let { error } = await supabase
    .from(table)
    .update(mappedData)
    .eq("id", ref.id);

  if (error) {
    console.error(
      `Supabase DB Error (updateDoc for ${ref.collectionPath}):`,
      error,
    );
  }
}

export async function deleteDoc(ref: DocReference) {
  const table = tableMap(ref.collectionPath);
  let query = supabase.from(table).delete().eq("id", ref.id);
  if (table === "firestore_docs") {
    query = query.eq("collection_id", ref.collectionPath);
  }
  const { error } = await query;

  if (error) {
    console.error(
      `Supabase DB Error (deleteDoc for ${ref.collectionPath}):`,
      error,
    );
  }
}

export function onSnapshot(ref: any, callback: any, errorCallback?: any) {
  // Use polling on top of Supabase API to emulate onSnapshot
  if (ref instanceof DocReference) {
    getDoc(ref)
      .then(callback)
      .catch((err) => {
        if (errorCallback) errorCallback(err);
      });
  } else {
    getDocs(ref)
      .then(callback)
      .catch((err) => {
        if (errorCallback) errorCallback(err);
      });
  }

  const interval = setInterval(() => {
    if (ref instanceof DocReference) {
      getDoc(ref)
        .then(callback)
        .catch((e) => {});
    } else {
      getDocs(ref)
        .then(callback)
        .catch((e) => {});
    }
  }, 5000);

  return () => clearInterval(interval);
}

export function serverTimestamp() {
  return Date.now();
}

export const Timestamp = {
  now: () => ({
    seconds: Math.floor(Date.now() / 1000),
    toMillis: () => Date.now(),
  }),
};

export function getFirestore() {
  return {}; // stub db
}

export async function getDocFromServer(ref: DocReference) {
  return getDoc(ref);
}

export class WriteBatch {
  _ops: any[] = [];
  commit = async () => {
    for (let op of this._ops) {
      if (op.type === "set") await setDoc(op.ref, op.data);
      if (op.type === "update") await updateDoc(op.ref, op.data);
      if (op.type === "delete") await deleteDoc(op.ref);
    }
  };
  update = (ref: any, data: any) => {
    this._ops.push({ type: "update", ref, data });
  };
  set = (ref: any, data: any) => {
    this._ops.push({ type: "set", ref, data });
  };
  delete = (ref: any) => {
    this._ops.push({ type: "delete", ref });
  };
}

export function writeBatch(db: any) {
  return new WriteBatch();
}
