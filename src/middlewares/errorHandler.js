const errorHandler = (err, req, res, next) => {
	console.error(err.stack); //  for debugging
	const statusCode = err.statusCode || 500;
	const message = err.message || "Internal Server Error";

	res.status(statusCode).json({
		errors: [
			{
				message: message,
			},
		],
	});
};

module.exports = { errorHandler }