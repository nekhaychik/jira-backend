import { NotFoundException } from '@nestjs/common';
import { Document, FilterQuery, Model, Types, UpdateQuery } from 'mongoose';

import { QueryInterface, QueryOptions, RepositoryOptions } from '../';

export class Repository<T, D extends Document> {
  constructor(private model: Model<T & D>, private options: RepositoryOptions<T>) {}

  private expandProjection(options?: QueryOptions<T>) {
    if (!options) {
      return {};
    }

    const include = options.projectColumns?.map((projectColumn) => ({
      [projectColumn]: 1,
    }));
    const exclude = options.skipColumns?.map((projectColumn) => ({
      [projectColumn]: 0,
    }));

    return { ...include, ...exclude };
  }

  public async create(document: Partial<T>) {
    const createdDocument = await this.model.create(document);

    return this.model.findOne({ _id: createdDocument._id }).lean().exec();
  }

  public async delete(filter: FilterQuery<T & D>, options?: QueryOptions<T>) {
    const exists = await this.exists(filter, options);

    if (!exists) {
      throw new NotFoundException(`Document of type ${this.model.modelName} not found`);
    }

    let basicQuery = this.model.deleteMany(filter);

    if (options?.session) {
      basicQuery = basicQuery.session(options.session);
    }

    return basicQuery.exec();
  }

  public async exists(filter: FilterQuery<T & D>, options?: QueryOptions<T>) {
    let baseQuery = this.model.countDocuments(filter);

    if (options?.session) {
      baseQuery = baseQuery.session(options.session);
    }

    return (await baseQuery.exec()) > 0;
  }

  public async find(filter: FilterQuery<T & D> = {}, options?: QueryOptions<T>, queryOptions?: QueryInterface) {
    const basicQuery = this.model.find(filter, this.expandProjection(options), queryOptions);
    const documents = await basicQuery.lean().exec();

    return documents;
  }

  public async findOne(filter: FilterQuery<T & D>, options?: QueryOptions<T>) {
    const baseQuery = this.model.findOne(filter, this.expandProjection(options));

    return baseQuery.lean().exec();
  }

  public async findOneOrFail(filter: FilterQuery<T & D>, options?: QueryOptions<T>) {
    let baseQuery = this.model.findOne(filter);

    if (options?.session) {
      baseQuery = baseQuery.session(options.session);
    }

    const document = await baseQuery.lean().exec();

    if (!document) {
      throw new NotFoundException(
        `Document of type ${this.model.modelName} with filter criteria ${JSON.stringify(filter)} not found`,
      );
    }

    return document;
  }

  public async getById(id: Types.ObjectId, options?: QueryOptions<T>) {
    const document = await this.model.findById(id, this.expandProjection(options)).exec();

    if (!document) {
      throw new Error(`Document of type ${this.model.name} with ID ${id} not found`);
    }

    return document;
  }

  public async update(filter: FilterQuery<T & D>, updateQuery: UpdateQuery<T & D>, options?: QueryOptions<T>) {
    const exists = await this.exists(filter, options);

    if (!exists) {
      throw new NotFoundException(`Document of type ${this.model.modelName} not found`);
    }

    const basicQuery = this.model.updateOne(filter, updateQuery);

    if (options?.session) {
      basicQuery.session(options.session);
    }

    return basicQuery.exec();
  }

  public async updateAndGet(filter: FilterQuery<T & D>, updateQuery: UpdateQuery<T & D>, options?: QueryOptions<T>) {
    await this.update(filter, updateQuery, options);

    return this.findOneOrFail(filter, options);
  }

  public async updateMany(filter: FilterQuery<T & D>, updateQuery: UpdateQuery<T & D>, options?: QueryOptions<T>) {
    const basicQuery = this.model.updateMany(filter, updateQuery);

    if (options?.session) {
      basicQuery.session(options.session);
    }

    return basicQuery.exec();
  }
}
