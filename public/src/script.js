document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-candidatura');

  if (!form) {
    console.error('❌ Formulário não encontrado');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    try {
      const response = await fetch('/api/candidatura', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('Content-Type');

      if (!response.ok) {
        // Tenta extrair mensagem JSON se possível
        if (contentType && contentType.includes('application/json')) {
          const { error } = await response.json();
          throw new Error(error || 'Erro ao enviar candidatura');
        } else {
          const text = await response.text();
          throw new Error(text || 'Erro desconhecido no servidor');
        }
      }

      const result = await response.json();
      alert('✅ Candidatura enviada com sucesso!');
      console.log('📬 Resposta:', result);

      form.reset(); // limpa o formulário
    } catch (err) {
      console.error('❌ Erro ao enviar:', err);
      alert('Erro ao enviar: ' + err.message);
    }
  });
});
