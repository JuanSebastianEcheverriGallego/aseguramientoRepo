const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
createApp({ dbFile: process.env.DB_FILE || 'taskapp.db' }).listen(PORT, () => {
  console.log(`TaskApp escuchando en http://localhost:${PORT}`);
});
