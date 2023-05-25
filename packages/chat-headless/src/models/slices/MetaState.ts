/**
 * Maintains the metadata for Chat Headless.
 *
 * @public
 */
export interface MetaState {
  /**
   * Additional information to pass into the instruction flow. This data could
   * then be used in the URL or body of a REST API step, influence Chat API's
   * assessment in a conditional step, or help construct a reply with additional
   * details.
   *
   * @remarks
   * May be any valid JSON object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: any;
}
