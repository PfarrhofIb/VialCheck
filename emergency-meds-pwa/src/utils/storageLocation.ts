import { rememberStorageLocation } from '../db/storageLocationQueries'

export async function persistStorageLocation(value: string): Promise<string> {
  const trimmed = value.trim()
  if (trimmed) await rememberStorageLocation(trimmed)
  return trimmed
}
