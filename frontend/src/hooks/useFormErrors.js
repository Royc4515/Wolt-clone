import { useState } from 'react';

export default function useFormErrors() {
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  function clearFieldError(field) {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setServerError('');
  }

  return { errors, serverError, setErrors, setServerError, clearFieldError };
}
