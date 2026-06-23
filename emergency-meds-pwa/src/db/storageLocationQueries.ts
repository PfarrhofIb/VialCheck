import { db } from './schema'

export async function rememberStorageLocation(name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return
  const name_lower = trimmed.toLowerCase()
  const existing = await db.storage_locations.where('name_lower').equals(name_lower).first()
  if (!existing) {
    await db.storage_locations.add({ name: trimmed, name_lower })
  }
}

export async function searchStorageLocations(query: string, limit = 8): Promise<string[]> {
  const q = query.trim().toLowerCase()
  const all = await db.storage_locations.orderBy('name').toArray()
  return all
    .map((s) => s.name)
    .filter((name) => !q || name.toLowerCase().includes(q))
    .slice(0, limit)
}

export async function seedStorageLocationsFromNames(names: string[]): Promise<void> {
  for (const name of names) {
    await rememberStorageLocation(name)
  }
}
