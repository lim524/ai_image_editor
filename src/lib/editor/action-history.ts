export interface HistoryEntry {
  label: string;
  snapshot: string;
}

/** 동작별 라벨이 붙은 캔버스 스냅샷 실행 취소 스택 */
export class ActionHistoryStack {
  private snapshots: string[] = [];
  private labels: string[] = [];
  private index = -1;
  private navigating = false;

  reset(initialSnapshot: string, label = "불러오기") {
    this.snapshots = [initialSnapshot];
    this.labels = [label];
    this.index = 0;
  }

  get canUndo() {
    return this.index > 0;
  }

  get canRedo() {
    return this.index < this.snapshots.length - 1;
  }

  get undoLabel(): string | null {
    if (!this.canUndo) return null;
    return this.labels[this.index] ?? null;
  }

  get redoLabel(): string | null {
    if (!this.canRedo) return null;
    return this.labels[this.index + 1] ?? null;
  }

  /** 변경 직전 스냅샷을 저장하고, 변경 후 스냅샷으로 항목 추가 */
  record(beforeSnapshot: string, afterSnapshot: string, label: string) {
    if (this.navigating) return;
    if (beforeSnapshot === afterSnapshot) return;

    this.snapshots = this.snapshots.slice(0, this.index + 1);
    this.labels = this.labels.slice(0, this.index + 1);

    this.snapshots.push(afterSnapshot);
    this.labels.push(label);
    this.index = this.snapshots.length - 1;

    if (this.snapshots.length > 60) {
      this.snapshots.shift();
      this.labels.shift();
      this.index--;
    }
  }

  /** 현재 상태를 기준선으로만 등록 (패널 로드 등) */
  seed(snapshot: string, label = "불러오기") {
    this.reset(snapshot, label);
  }

  undo(): { snapshot: string; label: string } | null {
    if (!this.canUndo) return null;
    this.navigating = true;
    this.index--;
    const result = {
      snapshot: this.snapshots[this.index],
      label: this.labels[this.index + 1] ?? "",
    };
    this.navigating = false;
    return result;
  }

  redo(): { snapshot: string; label: string } | null {
    if (!this.canRedo) return null;
    this.navigating = true;
    this.index++;
    const result = {
      snapshot: this.snapshots[this.index],
      label: this.labels[this.index] ?? "",
    };
    this.navigating = false;
    return result;
  }
}
