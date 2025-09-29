const form = document.getElementById('desabafo-form');
const texto = document.getElementById('texto');
const usuario = document.getElementById('usuario');
const container = document.getElementById('desabafos-container');
const categoriaSelect = document.getElementById('categoria-filtro');
const limparTudoBtn = document.getElementById('limpar-tudo');
const modoEscuroBtn = document.getElementById('modo-escuro');
const notificacao = document.getElementById('notificacao');

const storageCurtidas = JSON.parse(localStorage.getItem('curtidas')) || { desabafos: [], comentarios: {} };

function mostrarNotificacao(msg, duracao = 2000) {
  notificacao.textContent = msg;
  notificacao.style.display = 'block';
  setTimeout(() => notificacao.style.display = 'none', duracao);
}

// Função que envia mensagem para o backend (WhatsApp)
function enviarParaBackend(msg, usuarioNome) {
  fetch('https://SEU_BACKEND_URL/enviar-whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: msg, usuario: usuarioNome })
  }).catch(err => console.log('Erro enviando WhatsApp:', err));
}

// Função principal para carregar desabafos
function carregarDesabafos() {
  let todos = JSON.parse(localStorage.getItem('desabafos')) || [];
  todos.sort((a, b) => {
    if (a.fixado && !b.fixado) return -1;
    if (!a.fixado && b.fixado) return 1;
    return (b.curtidas || 0) - (a.curtidas || 0);
  });

  container.innerHTML = '';
  const filtro = categoriaSelect.value;
  const desabafos = filtro === 'Todos' ? todos : todos.filter(d => d.categoria === filtro);

  desabafos.forEach((d, i) => {
    const div = document.createElement('div');
    const categoriaClasse = d.categoria.replace(' ', '');
    div.className = `desabafo ${categoriaClasse} ${d.fixado ? 'fixado' : ''}`;
    const nomeUsuario = d.usuario || 'Anônimo';
    div.innerHTML = `<strong>[${d.categoria}] ${nomeUsuario}</strong>: ${d.texto}
                     <div style="font-size:0.8rem; color:#555;">${d.data}</div>`;

    const botoesDiv = document.createElement('div');
    botoesDiv.className = 'botoes';

    // Apagar
    const apagarBtn = document.createElement('button');
    apagarBtn.className = 'apagar';
    apagarBtn.textContent = '❌ Apagar';
    apagarBtn.addEventListener('click', () => {
      todos.splice(i, 1);
      localStorage.setItem('desabafos', JSON.stringify(todos));
      carregarDesabafos();
      mostrarNotificacao('Desabafo apagado!');
    });
    botoesDiv.appendChild(apagarBtn);

    // Curtir único + animação
    const curtirBtn = document.createElement('button');
    curtirBtn.className = 'curtir';
    curtirBtn.textContent = `👍 ${d.curtidas || 0}`;
    if (!storageCurtidas.desabafos.includes(d.data)) {
      curtirBtn.addEventListener('click', () => {
        d.curtidas = (d.curtidas || 0) + 1;
        storageCurtidas.desabafos.push(d.data);
        localStorage.setItem('desabafos', JSON.stringify(todos));
        localStorage.setItem('curtidas', JSON.stringify(storageCurtidas));
        curtirBtn.classList.add('animado');
        setTimeout(() => curtirBtn.classList.remove('animado'), 300);
        carregarDesabafos();
      });
    } else {
      curtirBtn.disabled = true;
      curtirBtn.style.opacity = 0.6;
    }
    botoesDiv.appendChild(curtirBtn);

    // Fixar admin
    const fixarBtn = document.createElement('button');
    fixarBtn.className = 'fixar';
    fixarBtn.textContent = d.fixado ? '📌 Desfixar' : '📌 Fixar';
    fixarBtn.addEventListener('click', () => {
      const senha = prompt('Digite a senha do admin:');
      if (senha === 'dudinhadabahia') {
        d.fixado = !d.fixado;
        localStorage.setItem('desabafos', JSON.stringify(todos));
        carregarDesabafos();
        mostrarNotificacao(d.fixado ? 'Desabafo fixado!' : 'Desabafo desfixado!');
      } else mostrarNotificacao('Senha incorreta!');
    });
    botoesDiv.appendChild(fixarBtn);
    div.appendChild(botoesDiv);

    // Responder
    const responderBtn = document.createElement('button');
    responderBtn.textContent = 'Responder';
    responderBtn.style.marginTop = '10px';
    responderBtn.addEventListener('click', () => {
      const nomeResp = prompt('Digite seu nome (opcional):') || 'Anônimo';
      const respostaTexto = prompt('Digite sua resposta:');
      if (respostaTexto) {
        d.comentarios = d.comentarios || [];
        d.comentarios.push({
          texto: respostaTexto,
          usuario: nomeResp,
          curtidas: 0,
          data: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        });
        localStorage.setItem('desabafos', JSON.stringify(todos));
        carregarDesabafos();
        mostrarNotificacao('Comentário adicionado!');
        enviarParaBackend(respostaTexto, nomeResp);
      }
    });
    div.appendChild(responderBtn);

    // Comentários
    const comentariosDiv = document.createElement('div');
    comentariosDiv.className = 'comentarios';
    (d.comentarios || []).forEach((c, j) => {
      const cDiv = document.createElement('div');
      cDiv.className = 'comentario';
      cDiv.innerHTML = `<strong>${c.usuario || 'Anônimo'}</strong>: ${c.texto}
                        <div style="font-size:0.8rem; color:#555;">${c.data}</div>`;
      const cBotoes = document.createElement('div');
      cBotoes.className = 'botoes';
      const key = `${d.data}-${j}`;

      const cCurtir = document.createElement('button');
      cCurtir.className = 'curtir';
      cCurtir.textContent = `👍 ${c.curtidas || 0}`;
      if (!storageCurtidas.comentarios[key]) {
        cCurtir.addEventListener('click', () => {
          c.curtidas = (c.curtidas || 0) + 1;
          storageCurtidas.comentarios[key] = true;
          localStorage.setItem('desabafos', JSON.stringify(todos));
          localStorage.setItem('curtidas', JSON.stringify(storageCurtidas));
          cCurtir.classList.add('animado');
          setTimeout(() => cCurtir.classList.remove('animado'), 300);
          carregarDesabafos();
        });
      } else {
        cCurtir.disabled = true;
        cCurtir.style.opacity = 0.6;
      }
      cBotoes.appendChild(cCurtir);

      const cApagar = document.createElement('button');
      cApagar.className = 'apagar';
      cApagar.textContent = '❌ Apagar';
      cApagar.addEventListener('click', () => {
        d.comentarios.splice(j, 1);
        localStorage.setItem('desabafos', JSON.stringify(todos));
        carregarDesabafos();
        mostrarNotificacao('Comentário apagado!');
      });
      cBotoes.appendChild(cApagar);
      cDiv.appendChild(cBotoes);
      comentariosDiv.appendChild(cDiv);
    });
    div.appendChild(comentariosDiv);

    container.appendChild(div);
  });
}

// Enviar desabafo
form.addEventListener('submit', e => {
  e.preventDefault();
  const msg = texto.value.trim();
  if (!msg) return;
  const todos = JSON.parse(localStorage.getItem('desabafos')) || [];
  const data = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const novo = {
    texto: msg,
    usuario: usuario.value.trim() || 'Anônimo',
    categoria: categoriaSelect.value,
    data,
    curtidas: 0,
    fixado: false,
    comentarios: []
  };
  todos.push(novo);
  localStorage.setItem('desabafos', JSON.stringify(todos));
  texto.value = '';
  usuario.value = '';
  carregarDesabafos();
  mostrarNotificacao('Desabafo enviado!');
  enviarParaBackend(msg, novo.usuario);
});

// Limpar tudo
limparTudoBtn.addEventListener('click', () => {
  const senha = prompt('Digite a senha para apagar todos os desabafos:');
  if (senha === 'dudinhadabahia') {
    localStorage.removeItem('desabafos');
    localStorage.removeItem('curtidas');
    carregarDesabafos();
    mostrarNotificacao('Todos os desabafos foram apagados!');
  } else mostrarNotificacao('Senha incorreta!');
});

// Modo escuro
modoEscuroBtn.addEventListener('click', () => document.body.classList.toggle('dark'));

// Filtrar por categoria
categoriaSelect.addEventListener('change', carregarDesabafos);

// Carregar ao iniciar
window.addEventListener('load', carregarDesabafos);
