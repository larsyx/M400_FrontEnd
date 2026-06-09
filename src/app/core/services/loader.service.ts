import { Injectable } from "@angular/core";
import { BehaviorSubject, distinctUntilChanged, map } from "rxjs";

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private _pending = new BehaviorSubject<number>(0);
  loading$ = this._pending.pipe(
    map(n => n > 0),
    distinctUntilChanged()
  );

  show() {
    this._pending.next(this._pending.value + 1);
  }

  hide() {
    this._pending.next(Math.max(0, this._pending.value - 1));
  }

  reset() {
    this._pending.next(0);
  }
}