const queues = new Map();

// Serialize async operations per key; prevents concurrent read-modify-write races.
function withLock(key, fn) {
  const prev = queues.get(key) ?? Promise.resolve();
  let release;
  const gate = new Promise(r => { release = r; });
  const result = prev.then(async () => {
    try {
      return await fn();
    } finally {
      release();
      if (queues.get(key) === gate) queues.delete(key);
    }
  });
  queues.set(key, gate);
  return result;
}

module.exports = { withLock };
