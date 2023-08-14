import { Edge } from "../BrowserInfo";
import { css, expando, getChild, getRect, index, lastChild } from "../utils";

const CSSFloatProperty = Edge ? "cssFloat" : "float";

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
	if (window.CustomEvent && !Edge) {
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

export const checkCssPointerEventSupport = (documentExists) => {
	if (!documentExists) return;

	let el = document.createElement("x");
	el.style.cssText = "pointer-events:auto";
	return el.style.pointerEvents === "auto";
};

export const _detectDirection = (el, options) => {
	let elCSS = css(el),
		elWidth =
			parseInt(elCSS.width) -
			parseInt(elCSS.paddingLeft) -
			parseInt(elCSS.paddingRight) -
			parseInt(elCSS.borderLeftWidth) -
			parseInt(elCSS.borderRightWidth),
		child1 = getChild(el, 0, options),
		child2 = getChild(el, 1, options),
		firstChildCSS = child1 && css(child1),
		secondChildCSS = child2 && css(child2),
		firstChildWidth =
			firstChildCSS &&
			parseInt(firstChildCSS.marginLeft) +
				parseInt(firstChildCSS.marginRight) +
				getRect(child1).width,
		secondChildWidth =
			secondChildCSS &&
			parseInt(secondChildCSS.marginLeft) +
				parseInt(secondChildCSS.marginRight) +
				getRect(child2).width;

	if (elCSS.display === "flex") {
		return elCSS.flexDirection === "column" ||
			elCSS.flexDirection === "column-reverse"
			? "vertical"
			: "horizontal";
	}

	if (elCSS.display === "grid") {
		return elCSS.gridTemplateColumns.split(" ").length <= 1
			? "vertical"
			: "horizontal";
	}

	if (child1 && firstChildCSS.float && firstChildCSS.float !== "none") {
		let touchingSideChild2 = firstChildCSS.float === "left" ? "left" : "right";

		return child2 &&
			(secondChildCSS.clear === "both" ||
				secondChildCSS.clear === touchingSideChild2)
			? "vertical"
			: "horizontal";
	}

	return child1 &&
		(firstChildCSS.display === "block" ||
			firstChildCSS.display === "flex" ||
			firstChildCSS.display === "table" ||
			firstChildCSS.display === "grid" ||
			(firstChildWidth >= elWidth && elCSS[CSSFloatProperty] === "none") ||
			(child2 &&
				elCSS[CSSFloatProperty] === "none" &&
				firstChildWidth + secondChildWidth > elWidth))
		? "vertical"
		: "horizontal";
};

export const _dragElInRowColumn = (dragRect, targetRect, vertical) => {
	let dragElS1Opp = vertical ? dragRect.left : dragRect.top,
		dragElS2Opp = vertical ? dragRect.right : dragRect.bottom,
		dragElOppLength = vertical ? dragRect.width : dragRect.height,
		targetS1Opp = vertical ? targetRect.left : targetRect.top,
		targetS2Opp = vertical ? targetRect.right : targetRect.bottom,
		targetOppLength = vertical ? targetRect.width : targetRect.height;

	return (
		dragElS1Opp === targetS1Opp ||
		dragElS2Opp === targetS2Opp ||
		dragElS1Opp + dragElOppLength / 2 === targetS1Opp + targetOppLength / 2
	);
};

/**
 * Detects first nearest empty sortable to X and Y position using emptyInsertThreshold.
 * @param  {Number} x      X position
 * @param  {Number} y      Y position
 * @return {HTMLElement}   Element of the first found nearest Sortable
 */
export const _detectNearestEmptySortable = (x, y, sortables) => {
	let ret;
	sortables.some((sortable) => {
		const threshold = sortable[expando].options.emptyInsertThreshold;
		if (!threshold || lastChild(sortable)) return;

		const rect = getRect(sortable),
			insideHorizontally =
				x >= rect.left - threshold && x <= rect.right + threshold,
			insideVertically =
				y >= rect.top - threshold && y <= rect.bottom + threshold;

		if (insideHorizontally && insideVertically) {
			return (ret = sortable);
		}
	});
	return ret;
};

export const _prepareGroup = (options) => {
	function toFn(value, pull) {
		return function (to, from, dragEl, evt) {
			let sameGroup =
				to.options.group.name &&
				from.options.group.name &&
				to.options.group.name === from.options.group.name;

			if (value == null && (pull || sameGroup)) {
				// Default pull value
				// Default pull and put value if same group
				return true;
			} else if (value == null || value === false) {
				return false;
			} else if (pull && value === "clone") {
				return value;
			} else if (typeof value === "function") {
				return toFn(value(to, from, dragEl, evt), pull)(to, from, dragEl, evt);
			} else {
				let otherGroup = (pull ? to : from).options.group.name;

				return (
					value === true ||
					(typeof value === "string" && value === otherGroup) ||
					(value.join && value.indexOf(otherGroup) > -1)
				);
			}
		};
	}

	let group = {};
	let originalGroup = options.group;

	if (!originalGroup || typeof originalGroup != "object") {
		originalGroup = { name: originalGroup };
	}

	group.name = originalGroup.name;
	group.checkPull = toFn(originalGroup.pull, true);
	group.checkPut = toFn(originalGroup.put);
	group.revertClone = originalGroup.revertClone;

	options.group = group;
};

export const _hideGhostForTarget = (ghostEl, documentExists) => {
	if (!checkCssPointerEventSupport(documentExists) && ghostEl) {
		css(ghostEl, "display", "none");
	}
};

export const _unhideGhostForTarget = (ghostEl, documentExists) => {
	if (!checkCssPointerEventSupport(documentExists) && ghostEl) {
		css(ghostEl, "display", "");
	}
};

export const nearestEmptyInsertDetectEvent = (evt, dragEl, sortables) => {
	if (dragEl) {
		evt = evt.touches ? evt.touches[0] : evt;
		let nearest = _detectNearestEmptySortable(
			evt.clientX,
			evt.clientY,
			sortables
		);

		if (nearest) {
			// Create imitation event
			let event = {};
			for (let i in evt) {
				if (evt.hasOwnProperty(i)) {
					event[i] = evt[i];
				}
			}
			event.target = event.rootEl = nearest;
			event.preventDefault = void 0;
			event.stopPropagation = void 0;
			nearest[expando]._onDragOver(event);
		}
	}
};

export const _checkOutsideTargetEl = (evt, dragEl) => {
	if (dragEl) {
		dragEl.parentNode[expando]._isOutsideThisEl(evt.target);
	}
};
