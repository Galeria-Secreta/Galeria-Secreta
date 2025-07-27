const express = require('express');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.static('public'));
app.use(express.json());

// Corrigido para tabela 'candidaturas'
app.post('/api/dados', async (req, res) => {
  const { nome, idade, pais, provincia } = req.body;

  if (!nome || !idade || !pais || !provincia) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('candidaturas')
    .insert([{ nome, idade, pais, provincia }]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: 'Dados inseridos com sucesso!', data });
});

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
