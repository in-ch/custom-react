import { VirtualElement, VirtualElementType } from "./type";

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
const render = (
  element: VirtualElement,
  container: HTMLElement | Text | null
): void => {
  const DOM = createDOM(element);
  if (DOM && container) {
    if (Array.isArray(element.props.children)) {
      for (const child of element.props.children) {
        render(child as VirtualElement, DOM);
      }
    }
    container.appendChild(DOM);
  }
};

const isVirtualElement = (e: unknown): e is VirtualElement =>
  typeof e === "object" && e !== null && "type" in e && "props" in e;

export { createElement, render };
