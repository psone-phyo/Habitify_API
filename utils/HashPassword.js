const argon2 = require('argon2');

const hashPassword = async (password) => {
  const hash = await argon2.hash(password); // Automatically generates a salt
  return hash;
};

const verifyPassword = async (password, hash) => {
  return await argon2.verify(hash, password); // Returns true or false
};

module.exports = { hashPassword, verifyPassword };