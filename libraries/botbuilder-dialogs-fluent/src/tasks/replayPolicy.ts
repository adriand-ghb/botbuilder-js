// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Jsonify, JsonValue } from 'type-fest';

/**
 * Default value to json converter
 * @param value The value to convert.
 * @returns The converted value.
 */
export function convertToJson<T>(value: T): Jsonify<T> {
    return JSON.parse(JSON.stringify(value)) as Jsonify<T>;
}

/**
 * No-op conversion from json which returns the value as is.
 * @param value The value to convert.
 * @returns The passed-in value.
 */
export function convertFromJson<T extends JsonValue>(value: T): T {
    return value;
}


