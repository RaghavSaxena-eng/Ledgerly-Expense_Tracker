import mongoose from 'mongoose';

/**
 * Tenant isolation for a shared database.
 *
 * Every tenant-owned document carries an `organization` field. Route handlers never query
 * models directly: they go through tenantScope(Model, orgId), which forces the organization
 * filter onto every read, update, delete and aggregation. The org id always comes from the
 * authenticated user's record, never from the request body, query string or JWT payload,
 * and the injected filter is applied last so a client cannot override it.
 */
export function tenantScope(Model, orgId) {
  const org = new mongoose.Types.ObjectId(String(orgId));
  const guard = (filter = {}) => ({ ...filter, organization: org });

  return {
    find: (filter, projection) => Model.find(guard(filter), projection),
    findOne: (filter) => Model.findOne(guard(filter)),
    count: (filter) => Model.countDocuments(guard(filter)),
    create: (data) => Model.create({ ...data, organization: org }),
    updateById: (id, data) =>
      Model.findOneAndUpdate(guard({ _id: id }), { $set: data }, { new: true, runValidators: true }),
    deleteById: (id) => Model.findOneAndDelete(guard({ _id: id })),
    aggregate: (pipeline) => Model.aggregate([{ $match: { organization: org } }, ...pipeline]),
  };
}
