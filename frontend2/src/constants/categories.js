export const categories = [
    { id: 1, name: 'Consumable' },
    { id: 2, name: 'Deadstock' },
    { id: 3, name: 'Furniture and Fixture' }
  ];
  
  export const getCategoryName = (id) => {
    return categories.find(c => c.id === id)?.name || 'Unknown';
  };