import { Edge, IE11OrLess } from "../BrowserInfo";
import { expando, getChild, getRect, index, lastChild } from "../utils";

export const _globalDragOver = (/**Event*/ evt) => {
	if (evt.dataTransfer) {
		evt.dataTransfer.dropEffect = "move";
	}
	evt.cancelable && evt.preventDefault();
};

export const onMove = (
	fromEl,
	toEl,
	dragEl,
	dragRect,
	targetEl,
	targetRect,
	originalEvent,
	willInsertAfter
) => {
	let evt,
		sortable = fromEl[expando],
		onMoveFn = sortable.options.onMove,
		retVal;
	// Support for new CustomEvent feature
	if (window.CustomEvent && !IE11OrLess && !Edge) {
		evt = new CustomEvent("move", {
			bubbles: true,
			cancelable: true,
		});
	} else {
		evt = document.createEvent("Event");
		evt.initEvent("move", true, true);
	}

	evt.to = toEl;
	evt.from = fromEl;
	evt.dragged = dragEl;
	evt.draggedRect = dragRect;
	evt.related = targetEl || toEl;
	evt.relatedRect = targetRect || getRect(toEl);
	evt.willInsertAfter = willInsertAfter;

	evt.originalEvent = originalEvent;

	fromEl.dispatchEvent(evt);

	if (onMoveFn) {
		retVal = onMoveFn.call(sortable, evt, originalEvent);
	}

	return retVal;
};

export const _disableDraggable = (el) => {
	el.draggable = false;
};

export const _ghostIsFirst = (evt, vertical, sortable) => {
	let rect = getRect(getChild(sortable.el, 0, sortable.options, true));
	const spacer = 10;

	return vertical
		? evt.clientX < rect.left - spacer ||
				(evt.clientY < rect.top && evt.clientX < rect.right)
		: evt.clientY < rect.top - spacer ||
				(evt.clientY < rect.bottom && evt.clientX < rect.left);
};

export const _ghostIsLast = (evt, vertical, sortable) => {
	let rect = getRect(lastChild(sortable.el, sortable.options.draggable));
	const spacer = 10;

	return vertical
		? evt.clientX > rect.right + spacer ||
				(evt.clientX <= rect.right &&
					evt.clientY > rect.bottom &&
					evt.clientX >= rect.left)
		: (evt.clientX > rect.right && evt.clientY > rect.top) ||
				(evt.clientX <= rect.right && evt.clientY > rect.bottom + spacer);
};

export const _getSwapDirection = (
	evt,
	target,
	targetRect,
	vertical,
	swapThreshold,
	invertedSwapThreshold,
	invertSwap,
	isLastTarget,
	dragEl,
	targetMoveDistance,
	pastFirstInvertThresh,
	lastDirection
) => {
	let mouseOnAxis = vertical ? evt.clientY : evt.clientX,
		targetLength = vertical ? targetRect.height : targetRect.width,
		targetS1 = vertical ? targetRect.top : targetRect.left,
		targetS2 = vertical ? targetRect.bottom : targetRect.right,
		invert = false;

	if (!invertSwap) {
		// Never invert or create dragEl shadow when target movemenet causes mouse to move past the end of regular swapThreshold
		if (isLastTarget && targetMoveDistance < targetLength * swapThreshold) {
			// multiplied only by swapThreshold because mouse will already be inside target by (1 - threshold) * targetLength / 2
			// check if past first invert threshold on side opposite of lastDirection
			if (
				!pastFirstInvertThresh &&
				(lastDirection === 1
					? mouseOnAxis > targetS1 + (targetLength * invertedSwapThreshold) / 2
					: mouseOnAxis < targetS2 - (targetLength * invertedSwapThreshold) / 2)
			) {
				// past first invert threshold, do not restrict inverted threshold to dragEl shadow
				pastFirstInvertThresh = true;
			}

			if (!pastFirstInvertThresh) {
				// dragEl shadow (target move distance shadow)
				if (
					lastDirection === 1
						? mouseOnAxis < targetS1 + targetMoveDistance // over dragEl shadow
						: mouseOnAxis > targetS2 - targetMoveDistance
				) {
					return -lastDirection;
				}
			} else {
				invert = true;
			}
		} else {
			// Regular
			if (
				mouseOnAxis > targetS1 + (targetLength * (1 - swapThreshold)) / 2 &&
				mouseOnAxis < targetS2 - (targetLength * (1 - swapThreshold)) / 2
			) {
				return _getInsertDirection(target, dragEl);
			}
		}
	}

	invert = invert || invertSwap;

	if (invert) {
		// Invert of regular
		if (
			mouseOnAxis < targetS1 + (targetLength * invertedSwapThreshold) / 2 ||
			mouseOnAxis > targetS2 - (targetLength * invertedSwapThreshold) / 2
		) {
			return mouseOnAxis > targetS1 + targetLength / 2 ? 1 : -1;
		}
	}

	return 0;
};

/**
 * Gets the direction dragEl must be swapped relative to target in order to make it
 * seem that dragEl has been "inserted" into that element's position
 * @param  {HTMLElement} target       The target whose position dragEl is being inserted at
 * @return {Number}                   Direction dragEl must be swapped
 */
export const _getInsertDirection = (target, dragEl) => {
	if (index(dragEl) < index(target)) {
		return 1;
	} else {
		return -1;
	}
};

/**
 * Generate id
 * @param   {HTMLElement} el
 * @returns {String}
 * @private
 */
export const _generateId = (el) => {
	let str = el.tagName + el.className + el.src + el.href + el.textContent,
		i = str.length,
		sum = 0;

	while (i--) {
		sum += str.charCodeAt(i);
	}

	return sum.toString(36);
};

export const _saveInputCheckedState = (root, savedInputChecked) => {
	savedInputChecked.length = 0;

	let inputs = root.getElementsByTagName("input");
	let idx = inputs.length;

	while (idx--) {
		let el = inputs[idx];
		el.checked && savedInputChecked.push(el);
	}
};

export const _nextTick = (fn) => {
	return setTimeout(fn, 0);
};

export const _cancelNextTick = (id) => {
	return clearTimeout(id);
};
