const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mongooseModels = require('./models');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isMongoConnected = false;

// Read JSON file helper
function readLocalJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content || '[]');
    }
  } catch (err) {
    console.error(`[Local DB] Error reading ${filename}:`, err.message);
  }
  return [];
}

// Write JSON file helper
function writeLocalJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[Local DB] Error writing ${filename}:`, err.message);
    return false;
  }
}

// Seed initial data into MongoDB from local JSON files if collections are empty
async function seedDatabase() {
  try {
    const { User, Case, Audit, MedDRA, WHODrug } = mongooseModels;
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const usersData = readLocalJSON('users.json');
      if (usersData.length > 0) {
        await User.insertMany(usersData);
        console.log(`[MongoDB Seed] Migrated ${usersData.length} users to MongoDB.`);
      }
    }

    const meddraCount = await MedDRA.countDocuments();
    if (meddraCount === 0) {
      const meddraData = readLocalJSON('meddra.json');
      if (meddraData.length > 0) {
        await MedDRA.insertMany(meddraData);
        console.log(`[MongoDB Seed] Migrated ${meddraData.length} MedDRA terms to MongoDB.`);
      }
    }

    const whoDrugCount = await WHODrug.countDocuments();
    if (whoDrugCount === 0) {
      const whoData = readLocalJSON('who_drugs.json');
      if (whoData.length > 0) {
        await WHODrug.insertMany(whoData);
        console.log(`[MongoDB Seed] Migrated ${whoData.length} WHO drugs to MongoDB.`);
      }
    }

    const caseCount = await Case.countDocuments();
    if (caseCount === 0) {
      const casesData = readLocalJSON('cases.json');
      if (casesData.length > 0) {
        await Case.insertMany(casesData);
        console.log(`[MongoDB Seed] Migrated ${casesData.length} cases to MongoDB.`);
      }
    }

    const auditCount = await Audit.countDocuments();
    if (auditCount === 0) {
      const auditsData = readLocalJSON('audits.json');
      if (auditsData.length > 0) {
        await Audit.insertMany(auditsData);
        console.log(`[MongoDB Seed] Migrated ${auditsData.length} audits to MongoDB.`);
      }
    }
  } catch (err) {
    console.error('[MongoDB Seed] Seeding error:', err.message);
  }
}

// Connect to MongoDB
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[Database] No MONGODB_URI provided. Running in Local JSON mode.');
    return;
  }

  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`[MongoDB] Attempting connection to: ${maskedUri}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    isMongoConnected = true;
    console.log('[MongoDB] Connected successfully to MongoDB database!');
    await seedDatabase();
  } catch (err) {
    isMongoConnected = false;
    console.warn('[MongoDB] Connection Failed:', err.message);
    console.log('[Database] Falling back to Local JSON Storage mode (files in backend/data).');
  }
}

// Helper to match doc against MongoDB style filter
function matchDoc(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const key of Object.keys(filter)) {
    const cond = filter[key];
    if (key === '$or' && Array.isArray(cond)) {
      if (!cond.some(subFilter => matchDoc(doc, subFilter))) return false;
      continue;
    }
    const val = key.includes('.') ? key.split('.').reduce((o, i) => o?.[i], doc) : doc[key];
    if (cond instanceof RegExp) {
      if (!cond.test(String(val || ''))) return false;
    } else if (cond && typeof cond === 'object' && cond.$regex) {
      const rx = cond.$regex instanceof RegExp ? cond.$regex : new RegExp(cond.$regex, cond.$options || '');
      if (!rx.test(String(val || ''))) return false;
    } else {
      if (String(val || '').toLowerCase() !== String(cond || '').toLowerCase() && val !== cond) return false;
    }
  }
  return true;
}

// Wrap a document to give it .save(), .toObject(), .lean()
function wrapDoc(doc, filename) {
  if (!doc) return null;
  const wrapped = { ...doc };
  wrapped.save = async function() {
    const list = readLocalJSON(filename);
    const idx = list.findIndex(item => (item.id && item.id === wrapped.id) || (item.caseNumber && item.caseNumber === wrapped.caseNumber) || (item.userId && item.userId === wrapped.userId) || (item._id && item._id === wrapped._id));
    if (idx !== -1) {
      list[idx] = { ...wrapped };
      delete list[idx].save;
      delete list[idx].toObject;
      delete list[idx].lean;
    } else {
      const clean = { ...wrapped };
      delete clean.save;
      delete clean.toObject;
      delete clean.lean;
      list.push(clean);
    }
    writeLocalJSON(filename, list);
    return wrapped;
  };
  wrapped.toObject = function() {
    const copy = { ...wrapped };
    delete copy.save;
    delete copy.toObject;
    delete copy.lean;
    return copy;
  };
  wrapped.lean = function() {
    return wrapped.toObject();
  };
  return wrapped;
}

// Factory to create model proxy
function createModelProxy(modelName, filename) {
  const proxy = {
    find(filter = {}, projection) {
      if (isMongoConnected) {
        return mongooseModels[modelName].find(filter, projection);
      }
      let items = readLocalJSON(filename).filter(d => matchDoc(d, filter));
      let sortField = null;
      let sortAsc = 1;
      let limitCount = null;

      const chain = {
        sort(sortObj) {
          if (sortObj) {
            const [k, dir] = Object.entries(sortObj)[0] || [];
            if (k) {
              sortField = k;
              sortAsc = dir === -1 || dir === 'desc' ? -1 : 1;
            }
          }
          return chain;
        },
        limit(n) {
          limitCount = n;
          return chain;
        },
        lean() {
          return chain;
        },
        then(resolve, reject) {
          let res = [...items];
          if (sortField) {
            res.sort((a, b) => {
              const va = a[sortField] || '';
              const vb = b[sortField] || '';
              if (va < vb) return -1 * sortAsc;
              if (va > vb) return 1 * sortAsc;
              return 0;
            });
          }
          if (limitCount && limitCount > 0) {
            res = res.slice(0, limitCount);
          }
          return Promise.resolve(res).then(resolve, reject);
        }
      };
      return chain;
    },

    findOne(filter = {}, projection) {
      if (isMongoConnected) {
        return mongooseModels[modelName].findOne(filter, projection);
      }
      const items = readLocalJSON(filename);
      const found = items.find(d => matchDoc(d, filter));
      const wrapped = found ? wrapDoc(found, filename) : null;
      return {
        lean() {
          return Promise.resolve(found ? { ...found } : null);
        },
        then(resolve, reject) {
          return Promise.resolve(wrapped).then(resolve, reject);
        }
      };
    },

    async countDocuments(filter = {}) {
      if (isMongoConnected) {
        return mongooseModels[modelName].countDocuments(filter);
      }
      const items = readLocalJSON(filename);
      return items.filter(d => matchDoc(d, filter)).length;
    },

    async create(data) {
      if (isMongoConnected) {
        return mongooseModels[modelName].create(data);
      }
      const items = readLocalJSON(filename);
      const newDoc = {
        _id: String(Date.now() + Math.random()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };
      items.push(newDoc);
      writeLocalJSON(filename, items);
      return wrapDoc(newDoc, filename);
    },

    async insertMany(arr) {
      if (isMongoConnected) {
        return mongooseModels[modelName].insertMany(arr);
      }
      const items = readLocalJSON(filename);
      const inserted = (arr || []).map(data => ({
        _id: String(Date.now() + Math.random()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      }));
      items.push(...inserted);
      writeLocalJSON(filename, items);
      return inserted.map(d => wrapDoc(d, filename));
    },

    async findOneAndUpdate(filter, update, options = {}) {
      if (isMongoConnected) {
        return mongooseModels[modelName].findOneAndUpdate(filter, update, options);
      }
      const items = readLocalJSON(filename);
      let idx = items.findIndex(d => matchDoc(d, filter));
      if (idx === -1) {
        if (options && options.upsert) {
          const docData = update.$set ? { ...update.$set } : { ...update };
          const newDoc = {
            _id: String(Date.now() + Math.random()),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...filter,
            ...docData
          };
          items.push(newDoc);
          writeLocalJSON(filename, items);
          return wrapDoc(newDoc, filename);
        }
        return null;
      }
      const existing = items[idx];
      const changes = update.$set ? update.$set : update;
      const updated = {
        ...existing,
        ...changes,
        updatedAt: new Date().toISOString()
      };
      items[idx] = updated;
      writeLocalJSON(filename, items);
      return wrapDoc(updated, filename);
    },

    async updateOne(filter, update) {
      if (isMongoConnected) {
        return mongooseModels[modelName].updateOne(filter, update);
      }
      return this.findOneAndUpdate(filter, update);
    },

    async deleteOne(filter) {
      if (isMongoConnected) {
        return mongooseModels[modelName].deleteOne(filter);
      }
      const items = readLocalJSON(filename);
      const idx = items.findIndex(d => matchDoc(d, filter));
      if (idx !== -1) {
        items.splice(idx, 1);
        writeLocalJSON(filename, items);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },

    async findOneAndDelete(filter) {
      if (isMongoConnected) {
        return mongooseModels[modelName].findOneAndDelete(filter);
      }
      const items = readLocalJSON(filename);
      const idx = items.findIndex(d => matchDoc(d, filter));
      if (idx !== -1) {
        const removed = items.splice(idx, 1)[0];
        writeLocalJSON(filename, items);
        return wrapDoc(removed, filename);
      }
      return null;
    }
  };

  return proxy;
}

const User = createModelProxy('User', 'users.json');
const Case = createModelProxy('Case', 'cases.json');
const Audit = createModelProxy('Audit', 'audits.json');
const Draft = createModelProxy('Draft', 'drafts.json');
const MedDRA = createModelProxy('MedDRA', 'meddra.json');
const WHODrug = createModelProxy('WHODrug', 'who_drugs.json');

module.exports = {
  connectDB,
  User,
  Case,
  Audit,
  Draft,
  MedDRA,
  WHODrug
};
