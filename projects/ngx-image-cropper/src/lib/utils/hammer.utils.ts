export type HammerStatic = new(element: HTMLElement | SVGElement, options?: any) => HammerManager;

/** @docs-private */
export interface HammerManager {
    get(eventName: string): HammerManager;

    set(options: any): HammerManager;
}
