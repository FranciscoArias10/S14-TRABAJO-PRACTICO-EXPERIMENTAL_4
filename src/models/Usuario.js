const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres.'],
      maxlength: [50, 'El nombre no puede superar 50 caracteres.'],
    },
    apellido: {
      type: String,
      required: [true, 'El apellido es obligatorio.'],
      trim: true,
      minlength: [2, 'El apellido debe tener al menos 2 caracteres.'],
      maxlength: [50, 'El apellido no puede superar 50 caracteres.'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio.'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [100, 'El email no puede superar 100 caracteres.'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria.'],
    },
    telefono: {
      type: String,
      trim: true,
      default: null,
      maxlength: [15, 'El teléfono no puede superar 15 caracteres.'],
    },
  },
  {
    collection: 'usuarios',
    timestamps: {
      createdAt: 'creado_en',
      updatedAt: 'actualizado_en',
    },
    toJSON: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Usuario', usuarioSchema);

