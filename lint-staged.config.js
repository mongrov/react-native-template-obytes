module.exports = {
  '**/*.{js,jsx,ts,tsx}': (filenames) => {
    const files = filenames.filter((filename) => {
      // lint-staged passes absolute paths; ignore anything under vendor/
      return (
        !filename.includes('/vendor/')
        && !filename.includes('\\vendor\\')
        && !filename.includes('/src/lib/rxdb/rxdb-premium/')
        && !filename.includes('\\src\\lib\\rxdb\\rxdb-premium\\')
      );
    });
    if (files.length === 0)
      return [];
    return [
      `npx eslint --fix --no-warn-ignored ${files.map(filename => `"${filename}"`).join(' ')}`,
    ];
  },
  '**/*.json': (filenames) => {
    const files = filenames.filter((filename) => {
      return (
        !filename.includes('/vendor/')
        && !filename.includes('\\vendor\\')
        && !filename.includes('/src/lib/rxdb/rxdb-premium/')
        && !filename.includes('\\src\\lib\\rxdb\\rxdb-premium\\')
      );
    });
    if (files.length === 0)
      return [];
    return [
      `npx eslint --fix --no-warn-ignored ${files.map(filename => `"${filename}"`).join(' ')}`,
    ];
  },
};
