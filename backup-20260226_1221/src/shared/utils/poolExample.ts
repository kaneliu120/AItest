import ObjectPool from 'object-pool';

const pool = new ObjectPool({
  create() {
    return new ExpensiveObject();
  },
  dispose(obj) {
    obj.reset();
  },
  maxSize: 10,
});

const obj = pool.use((obj) => {
  // use obj
  return result;
});