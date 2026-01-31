/**
 * useDebouncedValue.js
 *
 * Hook sencillo para "esperar un poco" antes de actualizar un valor.
 * Se usa para que la busqueda no dispare un calculo pesado en cada tecla.
 */

import { useEffect, useState } from 'react';

/**
 * Recibe un valor y devuelve una version "debounced".
 * Ejemplo: si escribes muy rapido, solo actualiza despues de X ms.
 */
const useDebouncedValue = (value, delay = 180) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Programamos la actualizacion y cancelamos si el valor cambia rapido.
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebouncedValue;
