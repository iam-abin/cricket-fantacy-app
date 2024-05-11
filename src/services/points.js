const captainsPoint = (point) => {
	return 2 * point;
};

const viceCaptainsPoint = (point) => {
	return Math.round(1.5 * point);
};


module.exports = {
	captainsPoint,
	viceCaptainsPoint,
};
