import { useEffect } from "react";

const useAutoDismiss = (error, setError, delay = 4000) => {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [error, setError, delay]);
};

export default useAutoDismiss;
