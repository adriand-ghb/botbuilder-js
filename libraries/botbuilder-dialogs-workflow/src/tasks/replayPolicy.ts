// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Jsonify, JsonValue } from 'type-fest';

/**
 * Represents a function that converts a value to a different type.
 * @template From The type of the input value.
 * @template To The type of the output value.
 * @param value The value to convert.
 * @returns The converted value.
 */
export type TaskResultConverter<From, To> = (value: From) => To;

export type TaskResultSettings<T,P extends JsonValue = Jsonify<T>, O=P> = {
    toJson: TaskResultConverter<T,P>;
    fromJson: TaskResultConverter<P,O>;
};

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


