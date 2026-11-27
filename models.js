const { Schema, model } = require('mongoose');

const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },          // bcrypt hash
}, { timestamps: true }));

const Post = model('Post', new Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true }));

module.exports = { User, Post };
