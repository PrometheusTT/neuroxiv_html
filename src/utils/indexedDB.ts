// src/utils/indexedDB.ts
import { openDB } from 'idb'

const DB_NAME = 'NeuronCacheDB'
const STORE_NAME = 'neuronCache'

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade (db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

export const getCachedData = async (key: string) => {
  const db = await initDB()
  return db.get(STORE_NAME, key)
}

export const setCachedData = async (key: string, data: any) => {
  const db = await initDB()
  return db.put(STORE_NAME, { key, ...data })
}

export const deleteCachedData = async (key: string) => {
  const db = await initDB()
  return db.delete(STORE_NAME, key)
}
