const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    email_verification: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('User', userSchema);