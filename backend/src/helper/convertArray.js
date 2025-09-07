export const convertToArray = (input) => {
  if (Array.isArray(input)) {
    // Already array hai - filter karke return karo
    return input.filter(Boolean);
  }

  if (typeof input === "string" && input.trim()) {
    // String hai - comma se split karo
    return input
      .split(",") // Comma se split
      .map((item) => item.trim()) // Extra spaces hatao
      .filter((item) => item.length > 0); // Empty items hatao
  }

  return [];
};
