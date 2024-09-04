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

const updateDOM = (DOM, prevProps, nextProps) => {
  const defaultPropKeys = "children";

  for (const [removePropKey, removePropValue] of Object.entries(prevProps)) {
    if (removePropKey.startsWith("on")) {
      DOM.removeEventListener(
        removePropKey.substr(2).toLowerCase(),
        removePropValue
      );
    } else if (removePropKey !== defaultPropKeys) {
      DOM[removePropKey] = "";
    }
  }

  for (const [addPropKey, addPropValue] of Object.entries(nextProps)) {
    if (addPropKey.startsWith("on")) {
      DOM.addEventListener(addPropKey.substr(2).toLowerCase(), addPropValue);
    } else if (addPropKey !== defaultPropKeys) {
      DOM[addPropKey] = addPropValue;
    }
  }
};

const createDOM = (fiberNode) => {
  const { type, props } = fiberNode;
  let DOM: HTMLElement | null | Text = null;

  if (type === "TEXT") {
    DOM = document.createTextNode("");
  } else if (typeof type === "string") {
    DOM = document.createElement(type);
  }

  if (DOM !== null) {
    updateDOM(DOM, {}, props);
  }

  return DOM;
};

const render = (element, container) => {
  const DOM = createDOM(element);
  if (Array.isArray(element.props.children)) {
    for (const child of element.props.children) {
      render(child, DOM);
    }
  }

  container.appendChild(DOM);
};

const isVirtualElement = (e: unknown): e is VirtualElement =>
  typeof e === "object";
