/**
 * use bit to represent the existance of each attribute
 * if the ith bit is 1 (attr & (1 << i)), then the set includes the ith attribute
 * i <= 31
 */
export type Attributes = number;

/**
 * store the name of attributes
 */
export type AttrNames = string[];

/**
 * store a piece of functional dependency
 * number is the indexes of attributes
 */
export interface FD {
  lhs: Attributes;
  rhs: Attributes;
}

export interface CheckNfResult {
  type: '2NF' | '3NF' | 'BCNF';
  result: boolean;
  msg?: string;
};
