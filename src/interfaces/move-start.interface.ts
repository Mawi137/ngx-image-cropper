export interface MoveStart {
    active: boolean;
    type: string | null;
    position: string | null;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    clientX: number;
    clientY: number;
}
