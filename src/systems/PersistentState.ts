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

  // --- PERSISTENT LEVEL PROGRESSION & STAR RATINGS (LOCAL STORAGE) ---
  public static markLevelCompleted(levelId: string, stars: number = 3): void {
    try {
      const completed = PersistentState.getCompletedLevels();
      if (!completed.includes(levelId)) {
        completed.push(levelId);
        localStorage.setItem('chrono_chaser_completed_levels', JSON.stringify(completed));
      }

      const currentStars = PersistentState.getLevelStars(levelId);
      if (stars > currentStars) {
        const starMap = PersistentState.getAllStarsMap();
        starMap[levelId] = stars;
        localStorage.setItem('chrono_chaser_level_stars', JSON.stringify(starMap));
      }
    } catch {
      // Fallback if localStorage is restricted
    }
  }

  public static getCompletedLevels(): string[] {
    try {
      const data = localStorage.getItem('chrono_chaser_completed_levels');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static isLevelCompleted(levelId: string): boolean {
    return PersistentState.getCompletedLevels().includes(levelId);
  }

  public static getLevelStars(levelId: string): number {
    const starMap = PersistentState.getAllStarsMap();
    return starMap[levelId] || 0;
  }

  private static getAllStarsMap(): Record<string, number> {
    try {
      const data = localStorage.getItem('chrono_chaser_level_stars');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }
}
