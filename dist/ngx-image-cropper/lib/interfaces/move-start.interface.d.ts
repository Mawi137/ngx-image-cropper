export interface MoveStart {
    active: boolean;
    type: MoveTypes | null;
    position: string | null;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    clientX: number;
    clientY: number;
}
export declare enum MoveTypes {
    Move = "move",
    Resize = "resize",
    Pinch = "pinch"
}
