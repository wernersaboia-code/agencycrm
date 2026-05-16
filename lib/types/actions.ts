/**
 * Standard result type for Server Actions and API responses.
 * All new actions should return ActionResult<T>.
 */
export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

/** Helper to create a success result. */
export function success<T>(data: T): ActionResult<T> {
    return { success: true, data }
}

/** Helper to create an error result. */
export function failure(error: string): ActionResult<never> {
    return { success: false, error }
}
