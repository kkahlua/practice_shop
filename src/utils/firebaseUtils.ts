import {
  Timestamp,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Timestamp 변환 유틸리티 함수
export const timestampToMillis = (timestamp: Timestamp): number => {
  return timestamp.toMillis();
};

// 도큐먼트 데이터를 가져오고 Timestamp를 밀리초로 변환하는 함수
export const getDocumentWithMillis = async <T>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Timestamp 객체를 밀리초로 변환
      Object.keys(data).forEach((key) => {
        if (data[key] instanceof Timestamp) {
          data[key] = timestampToMillis(data[key]);
        }
      });

      return { id: docSnap.id, ...data } as T;
    }

    return null;
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

// 도큐먼트를 생성하고 Timestamp 필드를 자동으로 추가하는 함수
export const createDocumentWithTimestamp = async <T extends object>(
  collectionName: string,
  data: T,
  customId?: string
): Promise<string> => {
  try {
    const timestamp = Timestamp.now();

    // undefined 값을 제거한 객체 생성
    const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const dataWithTimestamp = {
      ...filteredData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    let docRef;

    if (customId) {
      docRef = doc(db, collectionName, customId);
      await setDoc(docRef, dataWithTimestamp);
      return customId;
    } else {
      docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
};

// 도큐먼트를 업데이트하고 updatedAt Timestamp를 자동으로 업데이트하는 함수
export const updateDocumentWithTimestamp = async <T extends object>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const timestamp = Timestamp.now();

    await updateDoc(docRef, {
      ...data,
      updatedAt: timestamp,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

// 컬렉션 데이터를 가져오고 Timestamp를 밀리초로 변환하는 함수
export const getCollectionWithMillis = async <T>(
  collectionName: string,
  constraints: {
    field?: string;
    operator?: any;
    value?: any;
    orderByField?: string;
    orderDirection?: "asc" | "desc";
    limitCount?: number;
    startAfterDoc?: any;
  }[] = []
): Promise<T[]> => {
  try {
    const collectionRef = collection(db, collectionName);
    let queryRef = query(collectionRef);

    if (constraints.length > 0) {
      const queryConstraints = [];

      for (const constraint of constraints) {
        if (
          constraint.field &&
          constraint.operator &&
          constraint.value !== undefined
        ) {
          queryConstraints.push(
            where(constraint.field, constraint.operator, constraint.value)
          );
        }

        if (constraint.orderByField) {
          queryConstraints.push(
            orderBy(constraint.orderByField, constraint.orderDirection || "asc")
          );
        }

        if (constraint.limitCount) {
          queryConstraints.push(limit(constraint.limitCount));
        }

        if (constraint.startAfterDoc) {
          queryConstraints.push(startAfter(constraint.startAfterDoc));
        }
      }

      queryRef = query(collectionRef, ...queryConstraints);
    }

    const querySnapshot = await getDocs(queryRef);
    const result: T[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Timestamp 객체를 밀리초로 변환
      Object.keys(data).forEach((key) => {
        if (data[key] instanceof Timestamp) {
          data[key] = timestampToMillis(data[key]);
        }
      });

      result.push({ id: doc.id, ...data } as T);
    });

    return result;
  } catch (error) {
    console.error("Error getting collection:", error);
    throw error;
  }
};

// 도큐먼트 삭제 함수
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};
