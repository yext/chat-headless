/**
 * Maintains the status of the latest chat API request.
 *
 * @public
 */
export interface ChatStatusState {
  /**
   * Whether the next message is currently processing or has finished processing.
   */
  isLoading?: boolean
}