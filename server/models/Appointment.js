/**
 * ./server/models/Appointment.js
 */

import mongoose, { Schema } from 'mongoose';

const mongoSchema = new Schema({
  service: {
    type: String,
    required: true,
  },
  day: {
    type: Date,
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  bookId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

mongoSchema.index({ bookId: 1, userId: 1 }, { unique: true });

const Appointment = mongoose.model('Appointment', mongoSchema);

export default Appointment;
