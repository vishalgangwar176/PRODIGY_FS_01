const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // TTL index: MongoDB auto-deletes expired documents
    index: { expires: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient lookup + rotation
tokenSchema.index({ userId: 1, tokenHash: 1 });

const MongooseToken = mongoose.model('Token', tokenSchema);
const { tokenStore } = require('../config/inMemoryStore');

// Transparent proxy: uses real Mongoose if connected, or tokenStore if offline
const TokenProxy = new Proxy(MongooseToken, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in tokenStore) {
      return typeof tokenStore[prop] === 'function' ? tokenStore[prop].bind(tokenStore) : tokenStore[prop];
    }
    return target[prop];
  },
});

module.exports = TokenProxy;
