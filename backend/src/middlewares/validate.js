function validate(schema, invalidResponse, statusCode = 200, source = 'body') {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      convert: true
    });

    if (error) {
      const response = typeof invalidResponse === 'function'
        ? invalidResponse(error)
        : invalidResponse;
      return res.status(statusCode).json(response);
    }

    if (source === 'params') {
      req.validatedParams = value;
    } else if (source === 'query') {
      req.validatedQuery = value;
    } else {
      req.validatedBody = value;
    }
    return next();
  };
}

module.exports = validate;
