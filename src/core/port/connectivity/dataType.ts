/**
 * @file Helpers for normalizing and comparing port data type declarations.
 */
import type { Port } from "../../../types/core";
import type { PortDefinition } from "../../../types/NodeDefinition";

type DataTypeValue = Port["dataType"] | PortDefinition["dataType"] | PortDefinition["dataTypes"];

export const normalizePortDataTypes = (value?: DataTypeValue): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  }
  return [value];
};

export const mergePortDataTypes = (primary?: DataTypeValue, secondary?: DataTypeValue): string[] => {
  const merged: string[] = [];
  const add = (types?: DataTypeValue) => {
    normalizePortDataTypes(types).forEach((type) => {
      if (!merged.includes(type)) {
        merged.push(type);
      }
    });
  };
  add(primary);
  add(secondary);
  return merged;
};

export const toPortDataTypeValue = (types: string[]): string | string[] | undefined => {
  if (types.length === 0) {
    return undefined;
  }
  if (types.length === 1) {
    return types[0];
  }
  return types;
};

export const primaryPortDataType = (value?: DataTypeValue): string | undefined => {
  const [first] = normalizePortDataTypes(value);
  return first;
};

export const arePortDataTypesCompatible = (a?: DataTypeValue, b?: DataTypeValue): boolean => {
  const aTypes = normalizePortDataTypes(a);
  const bTypes = normalizePortDataTypes(b);
  if (aTypes.length === 0 || bTypes.length === 0) {
    return true;
  }
  return aTypes.some((type) => bTypes.includes(type));
};

export const arePortDataTypesEqual = (a?: DataTypeValue, b?: DataTypeValue): boolean => {
  const aTypes = normalizePortDataTypes(a)
    .filter(Boolean)
    .sort();
  const bTypes = normalizePortDataTypes(b)
    .filter(Boolean)
    .sort();
  if (aTypes.length !== bTypes.length) {
    return false;
  }
  return aTypes.every((type, index) => type === bTypes[index]);
};
