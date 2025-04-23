import {
  Timestamp,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
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
