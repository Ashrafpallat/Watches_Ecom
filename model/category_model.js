const { default: mongoose } = require("mongoose");

const categorySchema = new mongoose.Schema({

  name: {
    type: String,
    unique: true,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['listed', 'unlisted'],
    default: 'listed'
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
  },

});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;