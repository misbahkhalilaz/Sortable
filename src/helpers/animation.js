export const repaint = (target) => {
	return target.offsetWidth;
};

export const calculateRealTime = (animatingRect, fromRect, toRect, options) => {
	return (
		(Math.sqrt(
			Math.pow(fromRect.top - animatingRect.top, 2) +
				Math.pow(fromRect.left - animatingRect.left, 2)
		) /
			Math.sqrt(
				Math.pow(fromRect.top - toRect.top, 2) +
					Math.pow(fromRect.left - toRect.left, 2)
			)) *
		options.animation
	);
};
