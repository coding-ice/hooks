import { useState } from 'react';
import useUpdateEffect from '../useUpdateEffect';

export interface IFuncUpdater<T> {
  (previousState?: T): T;
}

export interface IFuncStorage {
  (): Storage;
}

export type StorageStateDefaultValue<T> = T | IFuncUpdater<T>;

export type StorageStateResult<T> = [T | undefined, (value: StorageStateDefaultValue<T>) => void];

function isFunction<T>(obj: any): obj is T {
  return typeof obj === 'function';
}

export function createUseStorageState(nullishStorage: Storage | null) {
  function useStorageState<T>(
    key: string,
    defaultValue?: StorageStateDefaultValue<T>,
  ): StorageStateResult<T> {
    const storage = nullishStorage as Storage;
    const [state, setState] = useState<T | undefined>(() => getStoredValue());
    useUpdateEffect(() => {
      setState(getStoredValue());
    }, [key]);

    function getStoredValue() {
      const raw = storage.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (e) {}
      }
      if (isFunction<IFuncUpdater<T>>(defaultValue)) {
        return defaultValue();
      }
      return defaultValue;
    }

    function updateState(value?: T | IFuncUpdater<T>) {
      if (typeof value === 'undefined') {
        storage.removeItem(key);
        setState(undefined);
      } else if (isFunction<IFuncUpdater<T>>(value)) {
        const previousState = getStoredValue();
        const currentState = value(previousState);
        storage.setItem(key, JSON.stringify(currentState));
        setState(currentState);
      } else {
        storage.setItem(key, JSON.stringify(value));
        setState(value);
      }
    }

    return [state, updateState];
  }
  if (!nullishStorage) {
    return function (defaultValue: any) {
      return [
        isFunction<IFuncUpdater<any>>(defaultValue) ? defaultValue() : defaultValue,
        () => {},
      ];
    } as typeof useStorageState;
  }
  return useStorageState;
}
