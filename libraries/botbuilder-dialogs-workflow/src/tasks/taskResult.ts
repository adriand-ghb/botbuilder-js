// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { JsonValue } from "type-fest";


/**
 * Represents the outcome of a task's execution.
 * @template T (Optional) type of successful result value.
 */
export type TaskResult<T extends JsonValue = JsonValue> = {
  success: true, 
  value?: T
} | {
  success: false, 
  error: string
};
