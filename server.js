const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

// Dentro da rota POST:
let foto_url = null;

if (foto) {
  const ext = path.extname(foto.originalname);
  const storagePath = `fotos/${Date.now()}_${foto.originalname}`;
  const fileBuffer = fs.readFileSync(foto.path);

  const { error: uploadError } = await supabase.storage
    .from('candidaturas-fotos')
    .upload(storagePath, fileBuffer, {
      contentType: mime.lookup(ext) || 'image/jpeg',
    });

  if (uploadError) {
    console.error('Erro no upload da imagem:', uploadError);
    return res.status(500).json({ error: 'Erro ao enviar a imagem' });
  }

  foto_url = storagePath; // guardamos o caminho para salvar no banco
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

if (error) return res.status(500).json({ error: error.message });

res.status(200).json({ message: 'Candidatura enviada com sucesso!', data });
