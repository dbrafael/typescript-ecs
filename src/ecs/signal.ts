type SubscriptionFn<T> = (arg: T) => void;
type UnsubscribeFn = () => void;

export default class Subject<T> {
  protected _parent?: UnsubscribeFn;

  private _derived: Set<Subject<any>> = new Set();
  private _subscriptions: Set<SubscriptionFn<T>> = new Set();
  private _value: T | undefined = undefined;
  private _history: T[] = [];

  private _once: boolean;

  private notify() {
    this._subscriptions.forEach(sub => sub(this._value as T));
  }

  constructor(initialValue?: T, oneShot?: boolean) {
    this._once = !!oneShot;

    if (initialValue) {
      this._value = initialValue;
      this._history.push(initialValue);
    }
  };

  set value(value: T) {
    if (value === undefined) return;
    this._value = value;
    this.notify();
    if (this._once) {
      this.destroy();
    }
  }

  get value(): T {
    return this._value as T;
  }

  subscribe(subscriber: SubscriptionFn<T>, fromStart?: boolean): UnsubscribeFn {
    this._subscriptions.add(subscriber);
    if (fromStart) {
      setTimeout(() => this._history.forEach((v) => subscriber(v)), 0)
    }
    return this.unsubscribe.bind(this, subscriber);
  }

  unsubscribe(subscriber: (arg: T) => any) {
    this._subscriptions.delete(subscriber);
  }

  destroy() {
    if (this._parent) {
      this._parent
    }
    
    this._subscriptions.clear();
    this._derived.forEach((signal) => signal.destroy());
    this._derived.clear();
  }

  derived<E>(map: (arg: T) => E, filter?: (arg: T) => boolean): Subject<E> {
    const signal = new Subject<E>(undefined, false, );
    const subscription: SubscriptionFn<T> = (value) => {
      if (filter && !filter(value)) return;
      signal.value = map(value);
    };
    const unsub = this.subscribe(subscription, true);
    signal._parent = unsub;
    this._derived.add(signal);
    return signal;
  }

  map<E>(fn: (arg: T) => E): Subject<E> {
    return this.derived(fn);
  }

  filter(fn: (arg: T) => boolean): Subject<T> {
    return this.derived((v) => v, fn);
  }
}
