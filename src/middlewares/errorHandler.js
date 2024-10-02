const errorHandler = (error, req, res, next) => {
    console.error(err.stack); //  for debugging
    res.status(error.statusCode || 500).json({
        error: true,
        message: error.message,
    });
};

export { errorHandler };
