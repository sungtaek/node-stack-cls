
export interface NodeStackClsConfig {
  wrapperPrefix?: string;
  wrapperWaitTime?: number;
}

export interface NodeStackCls {
  config(options: NodeStackClsConfig): any;
  wrapper(func: any): Promise<any>;
  setContext(name: string, value: any): any;
  getContext(name: string): any;
}

declare const nscls: NodeStackCls;

export default nscls;