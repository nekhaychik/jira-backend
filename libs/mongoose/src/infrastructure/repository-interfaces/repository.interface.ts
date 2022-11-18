import { ClassConstructor } from 'class-transformer';
import { ClientSession } from 'mongoose';

export interface QueryOptions<T> {
  projectColumns?: Array<keyof T>;
  session?: ClientSession;
  skipColumns?: Array<keyof T>;
}

export interface RepositoryOptions<T> {
  baseClass: ClassConstructor<T>;
  caslClass?: ClassConstructor<T>;
}

export interface QueryInterface {
  limit?: number;
  offset?: number;
}
