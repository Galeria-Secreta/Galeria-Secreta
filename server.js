// server.js
const express = require('express');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Exemplo de rota para salvar dados no Supabase
app.post('/api/dados', async (req, res) => {
  const { nome, email } = req.body;
  const { data, error } = await supabase.from('usuarios').insert([{ nome, email }]);

  if (error) return res.status(500).json({ error });
  res.status(200).json({ data });
});

// Rota padrão
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
