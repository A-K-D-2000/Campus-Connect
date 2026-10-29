// Add the id to the list if missing, remove it if present (the upvote toggle)
export const toggleId = (list, id) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export const formatDate = (d) =>
  new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

// Merge new items into a list without duplicates, keeping time order
export const mergeById = (prev, items, newestFirst = false) => {
  const map = new Map(prev.map((x) => [x._id, x]));
  items.forEach((x) => map.set(x._id, x));
  return [...map.values()].sort((a, b) =>
    newestFirst
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt)
  );
};