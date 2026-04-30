import type { Kysely } from "kysely"
import { sql } from "kysely"
import type { DB } from "./db/types"
import { buildSearchTokenGroups } from "./search-query"

export interface ComponentCatalogQueryParams {
  subcategory_name?: string
  package?: string
  search?: string
  is_basic?: string
  is_preferred?: string
}

export async function queryComponentCatalog(
  db: Kysely<DB>,
  params: ComponentCatalogQueryParams,
): Promise<
  Array<{
    lcsc: number | null
    category: string | null
    subcategory: string | null
    mfr: string | null
    package: string | null
    basic: number | null
    preferred: number | null
    description: string | null
    stock: number | null
    price: string | null
    extra: string | null
  }>
> {
  let query = db
    .selectFrom("component_catalog")
    .selectAll()
    .where("stock", ">", 0)
    .orderBy("stock", "desc")
    .limit(100)

  if (params.subcategory_name) {
    query = query.where("subcategory", "=", params.subcategory_name)
  }

  if (params.package) {
    query = query.where("package", "=", params.package)
  }

  if (params.is_basic === "true") {
    query = query.where("basic", "=", 1)
  }

  if (params.is_preferred === "true") {
    query = query.where("preferred", "=", 1)
  }

  if (params.search) {
    const raw = params.search.trim()
    const tokenGroups = buildSearchTokenGroups(raw)
    const searchTokenGroups =
      tokenGroups.length > 0 ? tokenGroups : [[raw.toLowerCase()]]
    const filteredTokenGroups = searchTokenGroups
      .map((group) => group.filter((token) => token.length > 1))
      .filter((group) => group.length > 0)
    const likeTokenGroups =
      filteredTokenGroups.length > 0 ? filteredTokenGroups : searchTokenGroups

    for (const group of likeTokenGroups) {
      const groupConditions = group.map((token) => {
        const pattern = `%${token}%`
        return sql<boolean>`(
          LOWER(COALESCE(description, '')) LIKE ${pattern}
          OR LOWER(COALESCE(mfr, '')) LIKE ${pattern}
          OR LOWER(COALESCE(package, '')) LIKE ${pattern}
          OR LOWER(COALESCE(extra, '')) LIKE ${pattern}
        )`
      })
      query = query.where(
        sql<boolean>`(${sql.join(groupConditions, sql` OR `)})`,
      )
    }
  }

  return await query.execute()
}
