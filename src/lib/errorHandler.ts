/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OperationType } from '../types';

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errMessage = error instanceof Error ? error.message : String(error);
  
  if (errMessage.toLowerCase().includes("quota") || errMessage.toLowerCase().includes("resource-exhausted") || errMessage.toLowerCase().includes("limit exceeded")) {
    if (typeof window !== "undefined") {
      (window as any).__firebaseQuotaExceeded = true;
      window.dispatchEvent(new CustomEvent("firebase-quota-exceeded"));
    }
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  const errorMessage = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorMessage);
  
  if (operationType === OperationType.LIST || errMessage.toLowerCase().includes("quota") || errMessage.toLowerCase().includes("resource-exhausted")) {
    return;
  }
  
  throw new Error(errorMessage);
}
