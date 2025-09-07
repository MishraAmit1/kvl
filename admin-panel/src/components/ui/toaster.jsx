import { Toaster as HotToaster } from "react-hot-toast";

const Toaster = () => {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        success: {
          iconTheme: {
            primary: "hsl(142, 76%, 36%)",
            secondary: "hsl(var(--background))",
          },
          style: {
            border: "1px solid hsl(142, 76%, 36%)",
            background: "hsl(142, 76%, 36%, 0.1)",
          },
        },
        error: {
          iconTheme: {
            primary: "hsl(0, 84%, 60%)",
            secondary: "hsl(var(--background))",
          },
          style: {
            border: "1px solid hsl(0, 84%, 60%)",
            background: "hsl(0, 84%, 60%, 0.1)",
          },
        },
        loading: {
          iconTheme: {
            primary: "hsl(221, 83%, 53%)",
            secondary: "hsl(var(--background))",
          },
          style: {
            border: "1px solid hsl(221, 83%, 53%)",
            background: "hsl(221, 83%, 53%, 0.1)",
          },
        },
      }}
    />
  );
};

export default Toaster;
