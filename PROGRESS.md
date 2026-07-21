# Progress Log

## Location Feature

### Location Feature Development

- Created repository layer at `features/locations/location.repository.ts`
  - CRUD operations: `create`, `findById`, `getMany`, `get`, `update`, `delete`
  - Built-in type-safe selection utility `locationSelectData`
  - Clause builder `buildLocationWhereClause` filtering by case-insensitive name (3+ chars) and `locationType`
- Created service layer at `features/locations/location.service.ts`
  - Create: Associates creator session ID and handles auditing under the `LOCATION` entity
  - GetById: Retrieves location with paginated stocks, custom sorting (by stock type or name), and stock count
  - GetMany: Checks `canManageLocation` permission, returns paginated location records with creator/updater details
  - Update: Updates details and logs audit trail with old and new values
  - Delete: Checks `canDeleteLocation` rule (cannot delete location with active stocks), deletes, and logs audit trail
- Created rule layer at `features/locations/location.rule.ts`
  - Restricts location deletion if there are any associated stocks, returning a descriptive error message
- Created client-side API layer at `features/locations/location.api.ts`
  - Handles network requests for `getMany`, `getById`, `create`, `update`, and `delete` REST endpoints
- Created React hooks at `features/locations/location.hooks.ts`
  - Integrated TanStack Query hooks (`useLocation`, `useLocations`, `useCreateLocation`, `useUpdateLocation`, and `useDeleteLocation`) with caching and invalidation support
- Created frontend management component at `features/locations/components/LocationManagement.tsx`
  - Supports listing, filtering, searching, creating, updating, and deleting locations

### Location Feature Testing

- Created unit tests in `unit-tests/locations/` covering:
  - Deletion rules in `location.rule.test.ts`
  - Service functions in `location.service.*.test.ts` (create, delete, getById, getMany, update)
- Created integration tests at `integration-tests/location.service.integration.test.ts`
  - Exercises database-level semantics including case-insensitive search, sorting, and pagination
- Created E2E tests at `e2e-tests/location.spec.ts`
  - End-to-end user flows for creating, updating, and deleting locations, including verification of deletion blocks for locations with active items

## Category Feature

### Category Feature Development

- Created repository layer at `features/categories/category.repository.ts`
  - CRUD operations: `create`, `update`, `delete`, `getMany`, `countCategoryRows`, `getById`, and `get`
  - Clause builder `buildWhereClause` filtering by case-insensitive name (3+ chars)
- Created service layer at `features/categories/category.service.ts`
  - Create: Under transaction, creates category and writes a `CREATE` audit log under the `CATEGORY` entity
  - GetById: Retrieves category with paginated items (products), item count, and creator/updater details
  - GetMany: Returns paginated category records with dynamic item count
  - Update: Under transaction, updates name and logs a `UPDATE` audit log with both old and new names
  - Delete: Under transaction, validates `canDeleteCategory` rule, deletes category, and logs a `DELETE` audit log
- Created rule layer at `features/categories/category.rule.ts`
  - Restricts category deletion if it contains items, returning a descriptive warning message
- Created client-side API layer at `features/categories/category.api.ts`
  - Network wrapper for CRUD operations (`getById`, `getMany`, `create`, `update`, and `delete` endpoints)
- Created React hooks at `features/categories/category.hooks.ts`
  - TanStack Query queries/mutations (`useCategory`, `useCategories`, `useCreateCategory`, `useUpdateCategory`, and `useDeleteCategory`) with invalidation support using cache keys in `category.keys.ts`
- Created frontend components inside `features/categories/components/`
  - Main dashboard wrapper `CategoryManagement.tsx` for searching, paginating, and organizing category metrics
  - UI modular helpers: `CategoryFormDialog.tsx`, `CategoryDeleteModal.tsx` and custom tables `category-table` (`CategoryInfoPanel.tsx`, `CategoryInfoPanelTable.tsx`)

### Category Feature Testing

- Added comprehensive unit tests in `unit-tests/categories/` covering:
  - Deletion rules in `category.rule.test.ts`
  - Service functions in `category.service.*.test.ts` (create, delete, getById, getMany, update)
  - Leverages `jest-mock-extended` for strict type-safe mocking of the database transaction client (`PrismaClient`) and nested models without actual database connections

## Item Feature

### Item Feature Development

- Created repository layer at `features/items/item.repository.ts`
  - CRUD operations: `create`, `findById`, `getById`, `getManyInclude`, `countItems`, `update`, `delete`
  - Type-safe selection utilities: `createSelectItemData` and `createIncludeItemData` (identity helpers for Prisma select/include shapes)
  - Clause builder `buildWhereClause` filtering by `categoryId` and case-insensitive name search (3+ chars)
  - `create` atomically provisions the item, an optional initial stock record, and a `RECEIVE` stock movement in a single transaction
- Created service layer at `features/items/item.service.ts`
  - Create: Under transaction, creates item (with optional stock + movement) and writes a `CREATE` audit log under the `ITEM` entity; metadata includes category, location, selling price, and initial stock quantity
  - GetMany: Builds where clause from filter/search params, returns paginated items with category details using `getManyInclude`
  - GetById: Retrieves full item detail with paginated and sorted stocks; computes stock aggregates (`totalReadyStock`, `totalExpiredStock`, `totalDamagedStock`, `totalLostStock`, `totalDirtyStock`), unlocated and discarded quantities, and derives `isStockLow` from `minThreshold`
  - Update: Under transaction, updates item fields (name, category, description, image, selling price, attributes, active status, min threshold) and writes an `UPDATE` audit log with old and new values
  - Delete: Under transaction, guards against deleting an active item (`isActive: true`), deletes the item, and writes a `DELETE` audit log
- Created client-side API layer at `features/items/item.api.ts`
  - Network wrapper for `getMany`, `getById`, `create`, `update`, and `delete` REST endpoints
- Created React hooks at `features/items/item.hooks.ts`
  - TanStack Query queries/mutations (`useItem`, `useItems`, `useCreateItem`, `useUpdateItem`, `useDeleteItem`) with cache invalidation using keys in `item.keys.ts`
- Created frontend management component at `features/items/components/ItemManagement.tsx`
  - Supports listing, filtering by category, searching, creating, updating, deleting items, and managing per-item stocks

### Item Feature Testing

- Added comprehensive unit tests in `unit-tests/items/` covering:
  - Service functions in `item.service.*.test.ts` (`create`, `delete`, `getById`, `getMany`, `update`)
  - Leverages `jest-mock-extended` for strict type-safe mocking of database transaction client (`PrismaClient`) and nested models without actual database connections
  - `getById` test uses a custom `jest.mock` factory with `jest.requireActual` to preserve `createSelectItemData`/`createIncludeItemData` named exports as real identity functions while still auto-mocking all repository methods

## Stock Feature

### Stock Feature Development

- Created repository layer at `features/stocks/stock.repository.ts`
  - CRUD operations: `create`, `findById`, `findFirst`, `findOrUpdateOrCreate`, `getMany`, `get`, `update`, `delete`
  - Type-safe helpers: `stockWhereInput`, `stockWhereUniqueInput`, `stockSelectData`
  - Clause builders: `buildStockWhereClause` (location-based stock filter checking search queries and status categories: queryable, expired, expiring soon) and `buildStockCountWhereClause`
  - Aggregations: `countQuantity` (sum of quantity), `getGroupedStockQuantities` (groupBy itemId/type), and `countRows` (row count)
- Created service layer at `features/stocks/stock.service.ts`
  - Create: Under database transaction, checks item and location existence. If stock with matching item, location, type, and expiration date already exists, increments its quantity; otherwise creates new stock. Also creates a `RECEIVE` movement history and logs a `CREATE` audit log under the `STOCK` entity.
  - GetById: Retrieves stock with item, location, and creator details using type-safe select.
  - GetMany: Builds where query from filters (searchQuery, type, locationId, itemId), returns paginated stocks with total count.
  - Update: Under transaction, checks unique constraint conflict via rules, validates location, updates type, expiration, and location, logging an `UPDATE` audit log.
  - Delete: Under transaction, checks `checkCanDeleteStock` rule, deletes, and logs a `DELETE` audit log.
- Created rule layer at `features/stocks/stock.rule.ts`
  - Pure business rules defining queryable stock statuses (`READY`, `DAMAGED`, `DIRTY`).
  - Configurable expiration window days (via environment variable `EXPIRING_WINDOW_DAYS` or fallback defaults).
  - Status filter descriptors mapping to query kinds (`exactType`, `expiredBefore`, `expiringWithinWindow`).
  - Deletion rule `checkCanDeleteStock` blocks deletion of stocks with movement history.
  - Update rule `checkCanUpdateStock` prevents conflicts with existing records having same item, location, type, and expiration.
- Created client-side API layer at `features/stocks/stock.api.ts`
  - Network wrapper for REST client endpoints (`getById`, `getMany`, `create`, `delete`, and `update` via patch).
- Created React hooks at `features/stocks/stock.hooks.ts`
  - TanStack Query hooks (`useStocks`, `useStockById`, `useCreateStock`, `useUpdateStock`, and `useDeleteStock`) with caching and invalidation using keys in `stock.keys.ts` and `item.keys.ts`.
- Created frontend components inside `features/stocks/components/`
  - Main management layout `StockManagement.tsx` supporting filtering (search, type, location, item), sorting, pagination, and action dialog triggers.
  - Modal dialogues: `StockFormDialog.tsx` for creation/editing, and `StockDeleteModal.tsx` for deleting stock rows.
  - Custom tables: `stock-table` (including `TableHeader.tsx`, `TableRow.tsx`, and index) with search, sort, and pagination selectors.

### Stock Feature Testing

- Created unit test file at `tests/stock.spec.ts` for stock CRUD operations
- Test coverage includes: Create, Get list, Get by ID, Get by item, Update, and various error cases
- Follows the same pattern as `tests/item.spec.ts` for consistency
- Uses Playwright with serial execution mode

## Stock Movements Feature

### Stock Movements Feature Development

- Created repository layer at `features/stock-movements/stock-movements.repository.ts`
  - CRUD operations: `create`, `getById`, `getMany` (with sorting on item name, creation date, type, destination location, source location), `countRows`, `countQuantity`, `update`, `delete`
  - Helper function `createSelectStockMovementData` for type-safe select queries
- Created service layer at `features/stock-movements/stock-movements.service.ts`
  - Create: Under transaction, checks dependencies (item, stock, destination location, order).
    - Checks rule that movement types requiring stock row (TRANSFER, ADJUSTMENT, MARK_AS_DAMAGED, MARK_AS_DIRTY, etc.) must have `stockId` provided.
    - Rule: `LAUNDRY_IN` can only target stocks of type `READY`.
    - Handles movement types:
      - `RECEIVE` (creates global intake when `stockId` is null, or increments quantity of existing stock).
      - `TRANSFER` (moves stock between locations, validates destination is different and source has sufficient stock, updates source/creates or updates destination stock).
      - `ADJUSTMENT` (increments/decrements stock quantity, checks for sufficient stock).
      - `MARK_AS_DAMAGED`, `MARK_AS_DIRTY`, `MARK_AS_LOST`, `MARK_AS_EXPIRED` (uses `markStockAs` helper).
      - `DISCARD`, `LAUNDRY_OUT`, `CONSUME`, `SALE` (decrements stock quantity, checks for sufficiency).
    - Logs a `CREATE` audit log under `STOCK_MOVEMENT` entity.
  - GetById: Validates role/permission (`canManageItem`), retrieves full movement details.
  - GetMany: Validates role, filters by searchQuery (item name or reason), type, source/destination location, and returns paginated records with total count.
  - Update: Validates role, updates reason in transaction and logs an `UPDATE` audit log.
  - Delete: Comments out the delete operation (regular deletion disabled / not implemented).
- Created client-side API layer at `features/stock-movements/stock-movements.api.ts`
  - Handles client-side REST endpoint calls for `getById`, `getMany`, `create`, and `update` (using JSON request body for update REST endpoint).
- Created React hooks at `features/stock-movements/stock-movements.hooks.ts`
  - TanStack Query hooks (`useStockMovementsHooks`, `useStockMovement`, `useCreateStockMovement`, `useUpdateStockMovement`) with query cache invalidation on lists, detail keys, item details, and stock lists.
- Created frontend components inside `features/stock-movements/components/`
  - Main management layout `StockMovementManagement.tsx` supporting filtering (by search, type, source location, destination location), sorting, pagination, and details/form modal triggers.
  - Form and info dialogues: `StockMovementFormDialog.tsx` for creating/recording movements, and `StockMovementInfoDialog.tsx` for viewing details.
  - Custom tables: `stock-movement-table` (including `TableHeader.tsx`, `TableRow.tsx`, and index) with sorting, filtering, and page selectors.

### Stock Movements Testing

- Fixed `tests/stock-movement.spec.ts` to match actual implementation
- Removed non-existent functionality (quick actions, complex stock manipulation)
- Aligned with actual API endpoints and schema field names
- Test coverage: Create (RECEIVE), Get list, Get by ID, Update, and error cases
- Note: Delete functionality not implemented

## Notes

- Stock movement feature does not have delete functionality
- Integration testing is still not really important for now
- Item delete feature is turned off
