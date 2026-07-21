export interface PlayerInput {
  tick: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  action: boolean;
}

export function createEmptyInput(tick: number = 0): PlayerInput {
  return {
    tick,
    left: false,
    right: false,
    jump: false,
    action: false,
  };
}
