import Joi from 'joi';

// Input validation schemas
export const purchaseSchema = Joi.object({
  supplierId: Joi.string().required(),
  invoiceNo: Joi.string().required(),
  date: Joi.date().required(),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        unitPrice: Joi.number().min(0).required(),
        unit: Joi.string().optional().default('kg'), // Optional, defaults to 'kg'
      })
    )
    .min(1)
    .required(),
  totalAmount: Joi.number().min(0).required(),
  paidAmount: Joi.number().min(0).default(0),
  status: Joi.string().valid('recorded', 'paid', 'partial', 'cancelled').default('recorded'),
  shouldPrint: Joi.boolean().optional(),
});

export const supplierSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
});

export const itemSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().allow('', null).optional(),
  unit: Joi.string().required(),
  basePrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).allow(null).optional(),
  stock: Joi.number().min(0).default(0),
});

// Update schema: allow partial updates, require at least one key
export const itemUpdateSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().optional(),
  category: Joi.string().allow('', null).optional(),
  unit: Joi.string().optional(),
  basePrice: Joi.number().min(0).optional(),
  sellingPrice: Joi.number().min(0).allow(null).optional(),
  stock: Joi.number().min(0).optional(),
}).min(1);

// Middleware factory for validation
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      console.log('Validation error:', error.details);
      console.log('Request body:', req.body);
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }
    
    req.body = value;
    next();
  };
};
