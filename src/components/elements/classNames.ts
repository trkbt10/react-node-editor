/**
 * @file Class Names Utility
 * Provides a utility function for conditionally joining CSS class names
 */

type ClassValue = string | number | boolean | undefined | null;
type ClassArray = ClassValue[];
type ClassDictionary = Record<string, unknown>;
type ClassNameInput = ClassValue | ClassDictionary | ClassArray;

/**
 * A utility function for conditionally joining CSS class names.
 *
 * @param inputs - Any number of class name inputs (strings, objects, arrays)
 * @returns A string of joined class names
 *
 * @example
 * classNames('foo', 'bar'); // 'foo bar'
 * classNames('foo', { bar: true }); // 'foo bar'
 * classNames('foo', { bar: false }); // 'foo'
 * classNames('foo', ['bar', 'baz']); // 'foo bar baz'
 * classNames('foo', null, undefined, 0, false, 'bar'); // 'foo bar'
 */
export function classNames(...inputs: ClassNameInput[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) {
      continue;
    }

    const inputType = typeof input;

    if (inputType === "string" || inputType === "number") {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const arrayResult = classNames(...input);
      if (arrayResult) {
        classes.push(arrayResult);
      }
    } else if (inputType === "object") {
      const obj = input as ClassDictionary;
      for (const key in obj) {
        if (obj[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(" ");
}

// Default export for compatibility
export default classNames;
