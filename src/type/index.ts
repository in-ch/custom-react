export interface ComponentFunction {
  new (props: Record<string, unknown>): Component;
  (props: Record<string, unknown>): VirtualElement | string;
}
export type VirtualElementType = ComponentFunction | string;

export interface VirtualElementProps {
  children?: VirtualElement[];
  [propName: string]: unknown;
}
export interface VirtualElement {
  type: VirtualElementType;
  props: VirtualElementProps;
}

export interface Fiber {
  stateNode: HTMLElement | Text | null;
  props: Record<string, unknown>;
  type: VirtualElementType;
  children: Fiber[];
  deps?: any[];
  cleanup?: (() => void) | null;
}

abstract class Component {
  props: Record<string, unknown>;
  abstract state: unknown;
  abstract setState: (value: unknown) => void;
  abstract render: () => VirtualElement;

  constructor(props: Record<string, unknown>) {
    this.props = props;
  }
  static REACT_COMPONENT = true;
}
