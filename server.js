const express = require('express');
const path = require('path');
require('dotenv').config();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Configura upload local
const upload = multer({ dest: 'uploads/' });

const app = express();
const port = process.env.PORT || 3000;

// Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(express.static('public'));
app.use(express.json()); // para JSON (ex: /api/dados)
app.use(express.urlencoded({ extended: true })); // para forms padrão

// Rota para receber candidatura com FormData (incluindo imagem)
app.post('/api/candidatura', upload.single('foto'), async (req, res) => {
  try {
    const { nome, idade, pais, provincia, email, whatsapp } = req.body;
    const foto = req.file;

    if (!nome || !idade || !email || !whatsapp) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const { data, error } = await supabase.from('candidaturas').insert([{
      nome,
      idade: parseInt(idade),
      pais,
      provincia,
      email,
      whatsapp,
      foto_nome: foto?.originalname,
      foto_path: foto?.path
    }]);

    if (error) return res.status(500).json({ error });

    res.status(200).json({ message: 'Candidatura enviada com sucesso!', data });
  } catch (err) {
    console.error('Erro ao enviar candidatura:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota fallback para abrir o site
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
