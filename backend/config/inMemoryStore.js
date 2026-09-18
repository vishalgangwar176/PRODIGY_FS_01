const crypto = require('crypto');

/**
 * High-performance, zero-dependency in-memory MongoDB/Mongoose simulator.
 * Ensures the application runs immediately on localhost even without a local MongoDB service.
 */
class InMemoryStore {
  constructor(name) {
    this.name = name;
    this.docs = [];
  }

  _generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  _clone(obj) {
    if (!obj) return obj;
    const cloned = JSON.parse(JSON.stringify(obj));
    // Provide a save() method on documents to mimic Mongoose documents
    cloned.save = async () => {
      const idx = this.docs.findIndex((d) => String(d._id) === String(cloned._id));
      if (idx !== -1) {
        this.docs[idx] = { ...this.docs[idx], ...JSON.parse(JSON.stringify(cloned)), updatedAt: new Date() };
      }
      return cloned;
    };
    return cloned;
  }

  _match(doc, query) {
    for (const key of Object.keys(query)) {
      if (key === '_id' || key === 'id') {
        if (String(doc._id) !== String(query[key])) return false;
      } else if (key === 'expiresAt' && query[key]?.$gt) {
        if (new Date(doc.expiresAt) <= new Date(query[key].$gt)) return false;
      } else {
        if (doc[key] !== query[key]) return false;
      }
    }
    return true;
  }

  async create(data) {
    const doc = {
      _id: this._generateId(),
      role: 'user',
      isActive: true,
      isEmailVerified: false,
      emailOtp: { code: null, expiresAt: null },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.docs.push(doc);
    return this._clone(doc);
  }

  findOne(query) {
    const doc = this.docs.find((d) => this._match(d, query));
    const res = doc ? this._clone(doc) : null;

    const queryObj = {
      select: (fields) => {
        if (res && typeof fields === 'string') {
          if (fields.includes('-password')) delete res.password;
          if (fields.includes('+emailOtp.code') || fields.includes('+emailOtp.expiresAt')) {
            // Include them (already there in memory store since we don't strict-select by default, but we should make sure we don't accidentally drop them)
          } else {
             delete res.emailOtp;
          }
        }
        return Promise.resolve(res);
      },
      then: (resolve, reject) => resolve(res),
    };
    return queryObj;
  }

  findById(id) {
    return this.findOne({ _id: id });
  }

  findByIdAndUpdate(id, update, options = {}) {
    const idx = this.docs.findIndex((d) => String(d._id) === String(id));
    if (idx === -1) {
      return {
        select: () => Promise.resolve(null),
        then: (resolve) => resolve(null),
      };
    }
    this.docs[idx] = { ...this.docs[idx], ...update, updatedAt: new Date() };
    const res = this._clone(this.docs[idx]);
    return {
      select: (fields) => {
        if (fields && typeof fields === 'string') {
          if (fields.includes('-password')) delete res.password;
          if (!fields.includes('+emailOtp.code') && !fields.includes('+emailOtp.expiresAt')) {
             delete res.emailOtp;
          }
        }
        return Promise.resolve(res);
      },
      then: (resolve) => resolve(res),
    };
  }

  async deleteOne(query) {
    const idx = this.docs.findIndex((d) => this._match(d, query));
    if (idx !== -1) {
      this.docs.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async countDocuments(query = {}) {
    if (!Object.keys(query).length) return this.docs.length;
    return this.docs.filter((d) => this._match(d, query)).length;
  }

  find(query = {}) {
    let results = this.docs.filter((d) => this._match(d, query)).map((d) => this._clone(d));

    const chain = {
      select: (fields) => {
        if (fields && typeof fields === 'string') {
          if (fields.includes('-password')) {
            results.forEach((r) => delete r.password);
          }
          if (!fields.includes('+emailOtp.code') && !fields.includes('+emailOtp.expiresAt')) {
             results.forEach((r) => delete r.emailOtp);
          }
        }
        return chain;
      },
      sort: (sortObj) => {
        if (sortObj.createdAt === -1) {
          results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return chain;
      },
      skip: (n) => {
        results = results.slice(n);
        return chain;
      },
      limit: (n) => {
        results = results.slice(0, n);
        return chain;
      },
      then: (resolve) => resolve(results),
    };

    return chain;
  }

  index() {
    // No-op for compatibility
  }
}

const userStore = new InMemoryStore('users');
const tokenStore = new InMemoryStore('tokens');

module.exports = { userStore, tokenStore };
