import { Jsonify } from "type-fest";


/**
 * Interface for a callable that is bound to a dialog flow context.
 * @template T The type of the function to be called.
 */
export interface DialogFlowBoundCallable<A extends any[], R> {

    /**
     * Invokes the bound function with the given arguments.
     * @param args The arguments to pass to the function.
     * @returns The observable result of the function call.
     */
    (...args: A): R;

    /**
     * Gets a new function that taks the same arguments as the bound function and returns an observable
     * value of a different type.
     * 
     * @template T The type of the observable value produced by the projector
     * @param projector The callback used to convert the deserialized result to its observable value
     * @returns The projected function.
     */
    project<T>(
        projector: (value: R) => T
    ): (...args: A) => T;
}