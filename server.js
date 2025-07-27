app.post('/api/candidatura', upload.single('foto'), async (req, res) => {
  try {
    console.log('Recebido POST /api/candidatura');

    const { nome, idade, pais, provincia, email, whatsapp } = req.body;
    const foto = req.file;
    console.log('Campos recebidos:', req.body);
    console.log('Arquivo recebido:', foto);

    if (!nome || !idade || !email || !whatsapp) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    let foto_url = null;

    if (foto) {
      const fs = require('fs');
      const path = require('path');
      const mime = require('mime-types');

      const ext = path.extname(foto.originalname);
      const storagePath = `fotos/${Date.now()}_${foto.originalname}`;
      const fileBuffer = fs.readFileSync(foto.path);

      console.log('Enviando imagem para Supabase Storage...');

      const { error: uploadError } = await supabase.storage
        .from('candidaturas-fotos')
        .upload(storagePath, fileBuffer, {
          contentType: mime.lookup(ext) || 'image/jpeg',
        });

      if (uploadError) {
        console.error('Erro ao subir imagem:', uploadError.message);
        return res.status(500).json({ error: 'Erro ao enviar imagem' });
      }

      foto_url = storagePath;
    }

    const { data, error } = await supabase.from('candidaturas').insert([{
      nome,
      idade: parseInt(idade),
      pais,
      provincia,
      email,
      whatsapp,
      foto_url,
      termos_aceit: true
    }]);

    if (error) {
      console.error('Erro ao inserir no Supabase:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log('Candidatura salva com sucesso!');
    res.status(200).json({ message: 'Candidatura enviada com sucesso!', data });
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
