"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.useState = exports.render = exports.createElement = void 0;
var currentFiber = null;
var fiberStack = [];
/**
 * @param {string} text
 * @returns {VirtualElement}
 */
var createTextElement = function (text) { return ({
    type: "TEXT",
    props: {
        nodeValue: text
    }
}); };
/**
 * @param {VirtualElementType} type
 * @param { Record<string, unknown>?} props
 * @param {(unknown | VirtualElement)[]} child
 * @returns {VirtualElement}
 */
var createElement = function (type, props) {
    if (props === void 0) { props = {}; }
    var child = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        child[_i - 2] = arguments[_i];
    }
    var children = child.map(function (c) {
        return isVirtualElement(c) ? c : createTextElement(String(c));
    });
    return {
        type: type,
        props: __assign(__assign({}, props), { children: children })
    };
};
exports.createElement = createElement;
/**
 * @param {HTMLElement | Text} DOM
 * @param {Record<string, unknown>} prevProps
 * @param {Record<string, unknown>} nextProps
 * @returns {void}
 */
var updateDOM = function (DOM, prevProps, nextProps) {
    var defaultPropKeys = "children";
    for (var _i = 0, _a = Object.entries(prevProps); _i < _a.length; _i++) {
        var _b = _a[_i], removePropKey = _b[0], removePropValue = _b[1];
        if (removePropKey.startsWith("on")) {
            DOM.removeEventListener(removePropKey.slice(2).toLowerCase(), removePropValue);
        }
        else if (removePropKey !== defaultPropKeys) {
            DOM[removePropKey] = "";
        }
    }
    for (var _c = 0, _d = Object.entries(nextProps); _c < _d.length; _c++) {
        var _e = _d[_c], addPropKey = _e[0], addPropValue = _e[1];
        if (addPropKey.startsWith("on")) {
            DOM.addEventListener(addPropKey.slice(2).toLowerCase(), addPropValue);
        }
        else if (addPropKey !== defaultPropKeys) {
            DOM[addPropKey] = addPropValue;
        }
    }
};
/**
 * @param {VirtualElement} fiberNode
 * @returns {HTMLElement | Text | null}
 */
var createDOM = function (fiberNode) {
    var type = fiberNode.type, props = fiberNode.props;
    var DOM = null;
    if (type === "TEXT") {
        DOM = document.createTextNode(props.nodeValue || "");
    }
    else if (typeof type === "string") {
        DOM = document.createElement(type);
    }
    if (DOM !== null) {
        updateDOM(DOM, {}, props);
    }
    return DOM;
};
/**
 * @param {VirtualElement} element
 * @param {HTMLElement | Text | null} container
 * @returns {void}
 */
var render = function (element, container) {
    var fiber = createFiber(element);
    fiberStack.push(fiber);
    updateFiber(fiber);
    if (container) {
        container.appendChild(fiber.stateNode);
    }
};
exports.render = render;
/**
 * @param {VirtualElement} element
 * @returns {Fiber}
 */
var createFiber = function (element) {
    return {
        stateNode: createDOM(element),
        props: element.props,
        type: element.type,
        children: (element.props.children || []).map(createFiber)
    };
};
/**
 * @param {Fiber} fiber
 * @returns {void}
 */
var updateFiber = function (fiber) {
    var prevFiber = currentFiber;
    currentFiber = fiber;
    if (fiber.stateNode) {
        updateDOM(fiber.stateNode, (prevFiber === null || prevFiber === void 0 ? void 0 : prevFiber.props) || {}, fiber.props);
        for (var _i = 0, _a = fiber.children; _i < _a.length; _i++) {
            var child = _a[_i];
            updateFiber(child);
        }
    }
    currentFiber = prevFiber;
};
/**
 * Custom hook for state management
 * @param {any} initialState
 * @returns {[any, Function]}
 */
var useState = function (initialState) {
    var fiber = fiberStack[fiberStack.length - 1];
    var state = fiber.props.state || initialState;
    var setState = function (newState) {
        var _a;
        if (typeof newState === "function") {
            newState = newState(state);
        }
        state = newState;
        fiber.props = __assign(__assign({}, fiber.props), { state: state });
        render(fiber, (_a = fiber.stateNode) === null || _a === void 0 ? void 0 : _a.parentNode);
    };
    return [state, setState];
};
exports.useState = useState;
var isVirtualElement = function (e) {
    return typeof e === "object" && e !== null && "type" in e && "props" in e;
};
