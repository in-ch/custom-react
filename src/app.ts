import { VirtualElement, VirtualElementType, Fiber } from "@src/type";

let currentFiber: Fiber | null = null;
const fiberStack: Fiber[] = [];

/**
 * @param {string} text
 * @returns {VirtualElement}
 */
const createTextElement = (text: string): VirtualElement => ({
  type: "TEXT",
  props: {
    nodeValue: text,
  },
});

/**
 * @param {VirtualElementType} type
 * @param { Record<string, unknown>?} props
 * @param {(unknown | VirtualElement)[]} child
 * @returns {VirtualElement}
 */
const createElement = (
  type: VirtualElementType,
  props: Record<string, unknown> = {},
  ...child: (unknown | VirtualElement)[]
): VirtualElement => {
  const children = child.map((c) =>
    isVirtualElement(c) ? c : createTextElement(String(c))
  );

  return {
    type,
    props: {
      ...props,
      children,
    },
  };
};

/**
 * @param {HTMLElement | Text} DOM
 * @param {Record<string, unknown>} prevProps
 * @param {Record<string, unknown>} nextProps
 * @returns {void}
 */
const updateDOM = (
  DOM: HTMLElement | Text,
  prevProps: Record<string, unknown>,
  nextProps: Record<string, unknown>
): void => {
  const defaultPropKeys = "children";
  if (DOM instanceof HTMLElement) {
    // Handle HTMLElement props
    for (const [removePropKey, removePropValue] of Object.entries(prevProps)) {
      if (removePropKey.startsWith("on")) {
        DOM.removeEventListener(
          removePropKey.slice(2).toLowerCase(),
          removePropValue as EventListener
        );
      } else if (removePropKey !== defaultPropKeys) {
        (DOM as any)[removePropKey] = "";
      }
    }

    for (const [addPropKey, addPropValue] of Object.entries(nextProps)) {
      if (addPropKey.startsWith("on")) {
        DOM.addEventListener(
          addPropKey.slice(2).toLowerCase(),
          addPropValue as EventListener
        );
      } else if (addPropKey !== defaultPropKeys) {
        (DOM as any)[addPropKey] = addPropValue;
      }
    }
  } else if (DOM instanceof Text)
    (DOM as Text).nodeValue = (nextProps.nodeValue as string) || "";
};

/**
 * @param {VirtualElement} fiberNode
 * @returns {HTMLElement | Text | null}
 */
const createDOM = (fiberNode: VirtualElement): HTMLElement | Text | null => {
  const { type, props } = fiberNode;
  let DOM: HTMLElement | null | Text = null;
  if (type === "TEXT") {
    DOM = document.createTextNode((props.nodeValue as string) || "");
  } else if (typeof type === "string") {
    DOM = document.createElement(type);
  }
  if (DOM) {
    updateDOM(DOM, {}, props);
  }
  return DOM;
};

/**
 * @param {VirtualElement} element
 * @param {HTMLElement | Text | null} container
 * @returns {void}
 */
const render = (
  element: VirtualElement,
  container: HTMLElement | Text | null
): void => {
  if (!container) return;
  const fiber = createFiber(element);
  fiberStack.push(fiber);
  updateFiber(fiber);
  if (fiber.stateNode && container instanceof HTMLElement) {
    container.appendChild(fiber.stateNode);
  } else {
    console.error("Failed to append child: stateNode is not valid.");
  }
  fiber.children.forEach((childFiber) => {
    render(childFiber as unknown as VirtualElement, fiber.stateNode);
  });
  if (fiber.props?.onClick && fiber.stateNode instanceof HTMLElement) {
    fiber.stateNode.addEventListener(
      "click",
      fiber.props.onClick as EventListenerOrEventListenerObject
    );
  }
};

/**
 * @param {number} index target Fiber Node's index
 * @param {number} newState new state value
 * @returns {void}
 */
const reRender = (index: number, newState: any): void => {
  fiberStack[index].props.state = newState;
  fiberStack[index].stateNode?.remove();
  render(fiberStack[index], fiberStack[index].state);
};

/**
 * @param {VirtualElement} element
 * @returns {Fiber}
 */
const createFiber = (element: VirtualElement): Fiber => {
  return {
    stateNode: createDOM(element),
    props: element.props,
    type: element.type,
    children: ((element.props.children as VirtualElement[]) || []).map(
      createFiber
    ),
  };
};

/**
 * @param {Fiber} fiber
 * @returns {void}
 */
const updateFiber = (fiber: Fiber): void => {
  const prevFiber = currentFiber;
  currentFiber = fiber;
  if (fiber.stateNode) {
    updateDOM(fiber.stateNode, prevFiber?.props || {}, fiber.props);
    for (const child of fiber.children) {
      updateFiber(child);
    }
  }
  currentFiber = prevFiber;
};

/**
 * Custom hook for state management
 * @param {any} initialState - Initial state value
 * @returns {[any, Function]} - Current state and function to update the state
 */
const useState = (initialState: any): [any, Function] => {
  const fiber = fiberStack[fiberStack.length - 1];
  let state = (fiber.props as any).state || initialState;
  const setState = (newState: any) => {
    if (typeof newState === "function") {
      newState = newState(state);
    }
    const index = findStateIndex(state);
    state = newState;
    reRender(index, newState);
  };
  return [state, setState];
};

const findStateIndex = (state: string) => {
  return fiberStack.findIndex((_fiber) => _fiber.props.state === state);
};

const isVirtualElement = (e: unknown): e is VirtualElement =>
  typeof e === "object" && e !== null && "type" in e && "props" in e;

/**
 * Custom hook for side effects (useEffect)
 * @param {Function} effect - The effect function to run on mount/update
 * @param {Array<any>} deps - Dependency array to determine when to re-run the effect
 */
const useEffect = (effect: Function, deps: any[]) => {
  const fiber = fiberStack[fiberStack.length - 1];
  let prevDeps = (fiber.props as any).deps;
  const hasChanged = !prevDeps || deps.some((dep, i) => dep !== prevDeps[i]);
  if (hasChanged) {
    const cleanup = fiber.cleanup;
    if (cleanup) {
      cleanup();
    }
    const newCleanup = effect();
    fiber.cleanup = newCleanup;
    fiber.props = { ...fiber.props, deps };
  }
  return () => {
    if (fiber.cleanup) {
      fiber.cleanup();
    }
  };
};

export { createElement, render, useState, useEffect };
