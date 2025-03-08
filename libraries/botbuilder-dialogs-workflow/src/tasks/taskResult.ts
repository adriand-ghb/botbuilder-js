// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Jsonify, JsonValue } from "type-fest";


/**
 * Represents the outcome of a task's execution.
 * @template T (Optional) type of successful result value.
 */
export type TaskResult<T = any> = {
  success: true, 
  value?: Jsonify<T>,
} | {
  success: false, 
  error: string
};
