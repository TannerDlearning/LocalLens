// src/types/permission.ts

export interface CookieEntry {
  name: string;
  domain: string;
  path?: string;
}

export interface IndexedDBEntry {
  name: string;
  version: number;
}

export interface PermissionRecord {
  id: string;
  root_url: string;              // website origin
  created_at: string;            // ISO timestamp

  // captured data
  cookies?: CookieEntry[];
  local_storage?: Record<string, string>;
  indexeddb?: IndexedDBEntry[];
  cache_storage?: string[];
  service_workers?: string[];
  form_data?: Record<string, string>[];

  // computed
  trust_score?: number;
  ids?: string[];

  // legacy fields (from your earlier prototype, optional)
  url?: string;
  permission?: "cookies" | "location" | "notifications" | string;
  timestamp?: number;
}

export type ExtensionMessage =
  | {
      type: "NEW_RECORD";
      payload: PermissionRecord;
    }
  | {
      type: "DELETE_RECORD";
      payload: { id: string };
    }
  | {
      type: "SYNC";
      payload: PermissionRecord[];
    }
  | {
      type: "ALL_RECORDS_RESPONSE";
      records: PermissionRecord[];
    }
  | {
      type: "REVOKE_CONFIRM" | "REVOKE_BULK_CONFIRM";
      origin?: string;
    };

export interface PermissionDBSchema {
  records: PermissionRecord;
}
