export type StateChangeListener = (key: string, value: boolean) => void;

export class PersistentState {
  private state: Map<string, boolean> = new Map();
  private listeners: StateChangeListener[] = [];

  public setState(key: string, value: boolean): void {
    const currentValue = this.state.get(key) || false;
    if (currentValue === value) return;

    this.state.set(key, value);
    this.notifyListeners(key, value);
  }

  public getState(key: string): boolean {
    return this.state.get(key) || false;
  }

  public onChange(listener: StateChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public resetAll(): void {
    const keys = Array.from(this.state.keys());
    this.state.clear();
    keys.forEach((key) => this.notifyListeners(key, false));
  }

  private notifyListeners(key: string, value: boolean): void {
    this.listeners.forEach((listener) => listener(key, value));
  }
}
